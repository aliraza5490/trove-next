from typing import Annotated, Sequence

from fastapi import APIRouter, Depends, UploadFile, Body
from uuid import UUID

from app.models.user import TokenData
from app.routes.knowledge_base.service import KBService
from app.utilities.auth import get_user_from_token
from app.utilities.db import get_session
from app.utilities.tags import Tags

kb_router = APIRouter(prefix="/kb", tags=[Tags.kb])


@kb_router.post("/upload", description="Upload Documents", summary="Upload Documents")
async def upload_files(files: list[UploadFile], session=Depends(get_session),
                       user: TokenData = Depends(get_user_from_token)):
    return await KBService.upload_files(files, user, session)


@kb_router.get("/list", description="List Documents", summary="List Documents")
async def list_files(session=Depends(get_session), user: TokenData = Depends(get_user_from_token)):
    return await KBService.list_files(user, session)


@kb_router.post("/batch-delete", description="Delete Documents", summary="Delete list of documents")
async def delete_file(file_ids: Annotated[list[UUID], Body(embed=True)], session=Depends(get_session),
                      user: TokenData = Depends(get_user_from_token)):
    return await KBService.delete_files([str(file_id) for file_id in file_ids], user, session)


@kb_router.delete("/{file_id}", description="List Documents", summary="Delete Document")
async def delete_file(file_id: UUID, session=Depends(get_session), user: TokenData = Depends(get_user_from_token)):
    return await KBService.delete_file(str(file_id), user, session)

