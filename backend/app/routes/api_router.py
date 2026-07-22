from fastapi import APIRouter, Depends, UploadFile

from app.settings import settings
from .auth.controller import auth_router
from .chat.controller import chat_router
from .chat.service import ChatService
from .knowledge_base.controller import kb_router
from .stats.controller import stats_router
from app.utilities.auth import get_user_from_token
from app.utilities.db import get_session

api_router = APIRouter(prefix=settings.API_V1_STR)

api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(kb_router)
api_router.include_router(stats_router)


@api_router.post("/upload", description="Upload file attachment", summary="Upload File")
async def standalone_upload(
    file: UploadFile,
    session=Depends(get_session),
    user=Depends(get_user_from_token)
):
    return await ChatService.upload_file(file=file, user=user, session=session)
