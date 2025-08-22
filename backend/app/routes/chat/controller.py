from fastapi import APIRouter, Depends

from ...models.user import User
from ...routes.chat.service import ChatService, MessageCreate
from ...utilities.auth import get_user_from_token
from ...utilities.tags import Tags
from ...utilities.db import get_session

chat_router = APIRouter(prefix="/chat", tags=[Tags.chat])


@chat_router.get("/message")
async def create_message(message: str, chat_id: str = None, session = Depends(get_session), user: User = Depends(get_user_from_token)):
    return await ChatService.create_message(message, chat_id, session, user)

@chat_router.get("/{chat_id}")
async def get_chat_history(chat_id: str, session = Depends(get_session), user: User = Depends(get_user_from_token)):
    return await ChatService.get_chat_history(chat_id, user, session)

@chat_router.get("/list")
async def get_chat_list(session = Depends(get_session), user: User = Depends(get_user_from_token)):
    return await ChatService.get_chat_list(session, user)

@chat_router.post("/{chat_id}/update")
async def update_chat_title(chat_id: str, new_title: str, session = Depends(get_session), user: User = Depends(get_user_from_token)):
    return await ChatService.update_chat_title(chat_id, new_title, session)

@chat_router.delete("/{chat_id}/delete")
async def delete_chat(chat_id: str, session = Depends(get_session), user: User = Depends(get_user_from_token)):
    return await ChatService.delete_chat(chat_id, user, session)
