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

        isNewChat = False
        chat = None
        # Basic validation
        if not chat_id:
            # Generate a title using the LLM
            title = await llm.ainvoke([
                ('system', 'You will generate a title for a new chat based on the user message. Without quotes.'),
                ('user', message)
            ])
            
            chat = Chat(title=title.content)
            session.add(chat)
            
            system_message = Message(
                chat_id=chat.id,
                message="Your name is Trove. You are a helpful AI assistant.",
                role=Role.SYSTEM
            )
            session.add(system_message)
            # Commit to persist id; expire_on_commit=False prevents attribute refresh
            await session.commit()
            # Capture id immediately to avoid any lazy-loads later
            chat_id = chat.id
            isNewChat = True
        else:
            chat_result = await session.exec(select(Chat).where(Chat.id == chat_id))
            chat = chat_result.first()
            chat_id = chat.id if chat else None

        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")    


        if isNewChat:
            # add_message is sync in this history implementation
            message = Message(
                chat_id=chat.id,
                message=message,
                role=Role.USER
            )

        chat_messages = await session.exec(select(Message).where(Message.chat_id == chat.id))
        messages = chat_messages.all()

        ROLE_MAP = {
            Role.USER.value: HumanMessage,
            Role.ASSISTANT.value: AIMessage,
            Role.SYSTEM.value: SystemMessage,
        }

        messages = [ROLE_MAP[msg.role](content=msg.message, id=str(msg.id)) for msg in messages]
        trimmedMessages = trim_messages(
            messages,
            max_tokens=45,
            strategy="last",
            include_system=True,
            allow_partial=False,
            token_counter=count_tokens_approximately,
        )
        # Use async invoke to avoid blocking event loop
        async def generate():
            full_response = ""
            for chunk in llm.stream(trimmedMessages):
                full_response += chunk.content
                if chunk.content:
                    yield f"data: {chunk.content}\n\n"
            ai_message = Message(
                chat_id=chat.id,
                message=full_response,
                role=Role.ASSISTANT
            )
            session.add(ai_message)
            await session.commit()
            
        
        return StreamingResponse(content=generate(), media_type="text/event-stream")
