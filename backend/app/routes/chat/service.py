from uuid import UUID
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from fastapi import HTTPException, status
from langchain_groq import ChatGroq
from langchain_core.messages import trim_messages
from langchain_core.messages.utils import count_tokens_approximately
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from pydantic import BaseModel
from fastapi.responses import StreamingResponse


from ...settings import settings
from ...models.user import User
from ...models.message import Message, Role
from ...models.chat import Chat


class MessageCreate(BaseModel):
    chat_id: UUID | None = None
    message: str


class ChatService:
    @classmethod
    async def create_message(cls, message: str, chat_id: str | None, session: AsyncSession, user: User):
        llm = ChatGroq(
            model="deepseek-r1-distill-llama-70b",
            temperature=0,
            max_tokens=None,
            reasoning_format="parsed",
            timeout=None,
            max_retries=2,
            api_key=settings.GROQ_API_KEY
        )

        # Avoid shadowing and normalize chat_id to UUID
        user_input = message
        chat_uuid: UUID | None = None
        if chat_id:
            try:
                chat_uuid = UUID(str(chat_id))
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid chat_id")

        isNewChat = False
        chat = None
        # Basic validation
        if not chat_uuid:
            # Generate a title using the LLM
            title = await llm.ainvoke([
                ('system', 'You will generate a title for a new chat based on the user message. Without quotes.'),
                ('user', user_input)
            ])

            chat = Chat(title=title.content, user_id=user.id)
            session.add(chat)
            await session.commit()
            await session.refresh(chat)

            system_message = Message(
                chat=chat,
                message="Your name is Trove. You are a helpful AI assistant.",
                role=Role.SYSTEM
            )
            user_message_row = Message(
                chat=chat,
                message=user_input,
                role=Role.USER
            )
            session.add(system_message)
            session.add(user_message_row)
            await session.commit()

            # Capture id immediately to avoid any lazy-loads later
            chat_uuid = chat.id
            isNewChat = True
        else:
            chat_result = await session.exec(select(Chat).where(Chat.id == chat_uuid))
            chat = chat_result.first()

            if not chat:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

            # Persist the user's message for existing chats as well
            user_message_row = Message(
                chat=chat,
                message=user_input,
                role=Role.USER
            )
            session.add(user_message_row)
            await session.commit()

        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

        chat_messages = await session.exec(select(Message).where(Message.chat_id == chat.id))
        messages = chat_messages.all()

        ROLE_MAP = {
            Role.USER: HumanMessage,
            Role.ASSISTANT: AIMessage,
            Role.SYSTEM: SystemMessage,
        }

        lc_messages = [ROLE_MAP[msg.role](content=msg.message, id=str(msg.id)) for msg in messages]
        trimmedMessages = trim_messages(
            lc_messages,
            max_tokens=45,
            strategy="last",
            include_system=True,
            allow_partial=False,
            token_counter=count_tokens_approximately,
        )
        # Use async streaming to avoid blocking event loop
        async def generate():
            full_response = ""
            async for chunk in llm.astream(trimmedMessages):
                if chunk.content:
                    full_response += chunk.content
                    yield f"data: {chunk.content}\n\n"
            ai_message = Message(
                chat=chat,
                message=full_response,
                role=Role.ASSISTANT
            )
            session.add(ai_message)
            await session.commit()
            yield f"chat_id:{chat.id}\n\n"

        return StreamingResponse(content=generate(), media_type="text/event-stream")

    @classmethod
    async def get_chat_history(cls, chat_id: str, user: User, session: AsyncSession):
        # Fetch chat
        chat_result = await session.exec(select(Chat).where(Chat.id == chat_id, Chat.user_id == user.id))
        chat = chat_result.first()
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

        # Fetch messages belonging to the chat
        msg_result = await session.exec(select(Message).where(Message.chat_id == chat.id, Message.role != Role.SYSTEM).order_by(Message.id))
        messages = msg_result.all()

        # Return a JSON-serializable structure with chat and its messages
        return {
            "chat": {
                "id": str(chat.id),
                "title": chat.title,
                "user_id": str(chat.user_id),
            },
            "messages": [
                {
                    "id": str(m.id),
                    "chat_id": str(m.chat_id) if m.chat_id else None,
                    "message": m.message,
                    "role": m.role.value if hasattr(m.role, "value") else str(m.role),
                }
                for m in messages
            ],
        }

    @classmethod
    async def get_chat_list(cls, session: AsyncSession, user: User):
        result = await session.exec(select(Chat).where(Chat.user_id == user.id))
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
    async def delete_chat(cls, chat_id: str, user: User, session: AsyncSession):
        chat_result = await session.exec(select(Chat).where(Chat.id == chat_id, Chat.user_id == user.id))
        chat = chat_result.first()
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

        await session.delete(chat)
        await session.commit()