from fastapi import APIRouter, Depends, UploadFile

from app.models.user import TokenData
from app.routes.knowledge_base.service import KBService
from app.utilities.auth import get_user_from_token
from app.utilities.db import get_session
from app.utilities.tags import Tags

kb_router = APIRouter(prefix="/kb", tags=[Tags.kb])


@kb_router.post("/upload", description="Upload Documents", summary="Upload Documents")
async def create_chat(files: list[UploadFile], session=Depends(get_session),
                      user: TokenData = Depends(get_user_from_token)):
    return await KBService.upload_files(files, user, session)
