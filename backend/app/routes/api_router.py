from fastapi import APIRouter

from .auth.controller import auth_router
from .chat.controller import chat_router
from app.settings import settings

api_router = APIRouter(prefix=settings.API_V1_STR)

api_router.include_router(auth_router)
api_router.include_router(chat_router)



