import json
from typing import cast
from uuid import UUID, uuid4

from fastapi import HTTPException, status, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from langchain_core.messages import trim_messages
from langchain_core.messages.utils import count_tokens_approximately
from langchain_core.prompts.chat import ChatPromptTemplate, MessagesPlaceholder
from langchain_groq import ChatGroq
from pydantic import BaseModel
from sqlalchemy.orm import selectinload, QueryableAttribute
from sqlmodel import select, asc, desc
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.chat import Chat
from app.models.file import File
from app.models.message import Message, Role
from app.models.user import TokenData
from app.settings import settings
from app.utilities.files import is_valid_file_type, save_file
from app.utilities.ocr import extract_text
from app.utilities.vector_store import text_splitter, get_vector_store


class MessageCreate(BaseModel):
    chat_id: UUID | None = None
    message: str


class ChatService:
    @classmethod
    async def create_chat(cls, message: str, user: TokenData, session: AsyncSession):
        llm = ChatGroq(
            model="openai/gpt-oss-20b",
            temperature=0,
            max_tokens=None,
            reasoning_format="parsed",
            timeout=None,
            max_retries=2,
            api_key=settings.GROQ_API_KEY
        )

        # Generate a title using the LLM
        title = await llm.ainvoke([
            ('system', 'You will generate a title for a new chat based on the user message. Without quotes.'),
            ('user', message)
        ])

        chat = Chat(title=title.content, user_id=user.id)
        session.add(chat)
        await session.commit()
        # await session.refresh(chat)
        #
        # system_message = Message(
        #     chat=chat,
        #     message="Your name is Trove. You are a helpful AI assistant.",
        #     role=Role.SYSTEM
        # )
        # session.add(system_message)
        # await session.commit()

        return chat

    @classmethod
    async def create_message(cls, message: str, chat_id: str, user: TokenData,
                             session: AsyncSession, uploaded_files: list[UploadFile] = None):
        chat_uuid: UUID | None = None
        if chat_id:
            try:
                chat_uuid = UUID(chat_id)
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid chat_id")

        chat_result = await session.exec(select(Chat).where(Chat.id == chat_uuid).limit(1))
        chat = chat_result.first()

        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

        user_message_doc = Message(
            chat=chat,
            message=message,
            role=Role.USER,
        )
        session.add(user_message_doc)

        files = []
        vector_store = await get_vector_store()
        if uploaded_files:
            for uploaded_file in uploaded_files:
                if not is_valid_file_type(uploaded_file.content_type):
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                        detail=f"File must be one of these {settings.VALID_UPLOAD_FILE_TYPES}")

                if uploaded_file.size > 10 * 1024 * 1024:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be less than 10mb")

                file_location = await run_in_threadpool(save_file, uploaded_file, user.id)

                text = await run_in_threadpool(extract_text, path=str(file_location))

                file = File(
                    file_name=uploaded_file.filename,
                    file_size=uploaded_file.size,
                    file_path=str(file_location),
                    user_id=user.id,
                    message_id=user_message_doc.id
                )
                session.add(file)

                docs = text_splitter.create_documents([text])
                metadata = [{"type": "attachment", "file_id": str(file.id), "chat_id": chat_id} for _ in docs]
                docs = text_splitter.create_documents([text], metadatas=metadata, ids=[str(uuid4()) for _ in docs])
                await vector_store.aadd_documents(docs)

                file_info = {
                    "text": text,
                    "file_location": file_location,
                    "documents": docs,
                    "file_id": file.id,
                }
                files.append(file_info)

            if len(files):
                print("Uploaded Files", files)

        llm = ChatGroq(
            model="openai/gpt-oss-20b",
            temperature=0,
            max_tokens=None,
            reasoning_format="parsed",
            timeout=None,
            max_retries=2,
            api_key=settings.GROQ_API_KEY
        )

        chat_messages = await session.exec(
            select(Message).where(Message.chat_id == chat.id).order_by(asc(Message.created_at))
        )
        messages = chat_messages.all()

        ROLE_MAP = {
            Role.USER: HumanMessage,
            Role.ASSISTANT: AIMessage,
            Role.SYSTEM: SystemMessage,
        }
        lc_messages = [ROLE_MAP[msg.role](content=msg.message, id=str(msg.id)) for msg in messages]
        trimmed_messages = trim_messages(
            lc_messages,
            max_tokens=10000,
            strategy="last",
            include_system=False,
            allow_partial=False,
            token_counter=count_tokens_approximately,
        )

        docs_search_filter = {
            "type": "upload"
        }
        context_docs = await vector_store.asimilarity_search(query=message, k=5, filter=docs_search_filter)
        context = " ".join([doc.page_content for doc in context_docs])

        upload_search_filter = {
            "type": "attachment",
            "chat_id": chat_id
        }
        uploaded_docs = await vector_store.asimilarity_search(query=message, k=5, filter=upload_search_filter)
        upload_context = " ".join([doc.page_content for doc in uploaded_docs])

        prompt_template = ChatPromptTemplate([
            SystemMessage(content=(
                "Your name is Trove. You are a helpful AI assistant."
                "Here is the context of this conversation:"
                f"{context}"
                f"{upload_context}"
            )),
            MessagesPlaceholder("prev_history"),
        ])

        chain = prompt_template | llm

        # commit
        await session.commit()

        # Use async streaming to avoid blocking event loop
        async def generate():
            full_response = ""
            async for chunk in chain.astream({
                "prev_history": trimmed_messages
            }):
                full_response += chunk.content
                event = {
                    "content": chunk.content,
                    "type": "message"
                }
                yield f"data: {json.dumps(event)}\n\n"
            ai_message = Message(
                chat=chat,
                message=full_response,
                role=Role.ASSISTANT
            )
            session.add(ai_message)
            await session.commit()
            event = {
                "content": str(chat_id),
                "type": "end"
            }
            yield f"data: {json.dumps(event)}\n\n"

        # return StreamingResponse(generate(), media_type="text/event-stream")
        return StreamingResponse(generate(), media_type="text/plain")

    @classmethod
    async def get_chat_history(cls, chat_id: str, user: TokenData, session: AsyncSession):
        # Fetch chat
        chat_query = await session.exec(select(Chat).where(Chat.id == chat_id, Chat.user_id == user.id).limit(1))
        chat = chat_query.first()
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

        # Fetch messages belonging to the chat
        msg_query = await session.exec(
            select(Message).options(selectinload(cast(QueryableAttribute, Message.attachments))).where(
                Message.chat_id == chat.id,
                Message.role != Role.SYSTEM)
            .order_by(asc(Message.created_at))
        )
        messages = msg_query.all()

        # Return a JSON-serializable structure with chat and its messages
        return {
            "chat": chat,
            "messages": [
                {
                    "id": str(m.id),
                    "chat_id": str(m.chat_id) if m.chat_id else None,
                    "message": m.message,
                    "role": m.role.value if hasattr(m.role, "value") else str(m.role),
                    "attachments": m.attachments if m.attachments else [],
                }
                for m in messages
            ],
        }

    @classmethod
    async def get_chat_list(cls, user: TokenData, session: AsyncSession):
        result = await session.exec(select(Chat).where(Chat.user_id == user.id).order_by(desc(Chat.created_at)))
        chats = result.all()
        return chats

    @classmethod
    async def update_chat_title(cls, chat_id: str, new_title: str, session: AsyncSession):
        chat_result = await session.exec(select(Chat).where(Chat.id == chat_id))
        chat = chat_result.first()
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

        chat.title = new_title
        session.add(chat)
        await session.commit()

    @classmethod
    async def delete_chat(cls, chat_id: str, user: TokenData, session: AsyncSession):
        chat_result = await session.exec(select(Chat).where(Chat.id == chat_id, Chat.user_id == user.id))
        chat = chat_result.first()
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

        await session.delete(chat)
        await session.commit()
