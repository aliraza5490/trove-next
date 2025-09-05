from fastapi import APIRouter

from app.settings import settings
from .auth.controller import auth_router
from .chat.controller import chat_router
from .knowledge_base.controller import kb_router
from .stats.controller import stats_router

api_router = APIRouter(prefix=settings.API_V1_STR)

api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(kb_router)
api_router.include_router(stats_router)



