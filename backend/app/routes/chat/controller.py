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
