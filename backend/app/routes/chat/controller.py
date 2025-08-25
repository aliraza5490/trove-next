from uuid import UUID
from fastapi import APIRouter, Depends

from ...models.user import User
from ...routes.chat.service import ChatService, MessageCreate
from ...utilities.auth import get_user_from_token
from ...utilities.tags import Tags
from ...utilities.db import get_session

chat_router = APIRouter(prefix="/chat", tags=[Tags.chat])


@chat_router.post("/create", description="Create a new chat with an initial message", summary="Create Chat")
async def create_chat(message: str, session = Depends(get_session), user: User = Depends(get_user_from_token)):
    return await ChatService.create_chat(message, user, session)

@chat_router.get("/message", description="Create a new message in a chat", summary="Create Message")
async def create_message(message: str, chat_id:  UUID, session = Depends(get_session), user: User = Depends(get_user_from_token)):
    return await ChatService.create_message(message, chat_id, session)

@chat_router.get("/list")
async def get_chat_list(session = Depends(get_session), user: User = Depends(get_user_from_token)):
    print(user)
    return await ChatService.get_chat_list(session, user)

@chat_router.get("/{chat_id}")
async def get_chat_history(chat_id: UUID, session = Depends(get_session), user: User = Depends(get_user_from_token)):
    return await ChatService.get_chat_history(chat_id, user, session)

@chat_router.post("/{chat_id}/update")
async def update_chat_title(chat_id: UUID, new_title: str, session = Depends(get_session), user: User = Depends(get_user_from_token)):
    return await ChatService.update_chat_title(chat_id, new_title, session)

@chat_router.delete("/{chat_id}/delete")
async def delete_chat(chat_id: UUID, session = Depends(get_session), user: User = Depends(get_user_from_token)):
    return await ChatService.delete_chat(chat_id, user, session)
