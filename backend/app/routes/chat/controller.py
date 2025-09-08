from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, Body

from app.models.user import TokenData
from app.routes.chat.service import ChatService
from app.utilities.auth import get_user_from_token
from app.utilities.db import get_session
from app.utilities.tags import Tags

chat_router = APIRouter(prefix="/chat", tags=[Tags.chat])


@chat_router.post("/create", description="Create a new chat with an initial message", summary="Create Chat")
async def create_chat(message: str, session=Depends(get_session), user: TokenData = Depends(get_user_from_token)):
    return await ChatService.create_chat(message=message, user=user, session=session)


@chat_router.post("/message", description="Create a new message in a chat", summary="Create Message", )
async def create_message(message: Annotated[str, Body()], chat_id: Annotated[UUID, Body()],
                         web_search: Annotated[bool, Body()] = False, files: list[UploadFile] = None,
                         session=Depends(get_session), user: TokenData = Depends(get_user_from_token)):
    return await ChatService.create_message(message=message, chat_id=str(chat_id), uploaded_files=files,
                                            web_search=web_search,
                                            session=session, user=user)


@chat_router.get("/list")
async def get_chat_list(session=Depends(get_session), user: TokenData = Depends(get_user_from_token)):
    return await ChatService.get_chat_list(session=session, user=user)


@chat_router.get("/{chat_id}")
async def get_chat_history(chat_id: UUID, session=Depends(get_session), user: TokenData = Depends(get_user_from_token)):
    return await ChatService.get_chat_history(chat_id=str(chat_id), user=user, session=session)


@chat_router.patch("/{chat_id}/update")
async def update_chat_title(chat_id: UUID, new_title: Annotated[str, Body(embed=True)], session=Depends(get_session),
                            user: TokenData = Depends(get_user_from_token)):
    return await ChatService.update_chat_title(chat_id=str(chat_id), new_title=new_title, session=session)


@chat_router.delete("/{chat_id}/delete")
async def delete_chat(chat_id: UUID, session=Depends(get_session), user: TokenData = Depends(get_user_from_token)):
    return await ChatService.delete_chat(chat_id=str(chat_id), user=user, session=session)
