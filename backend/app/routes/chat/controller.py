from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, Body, Query, Request

from app.models.user import TokenData
from app.routes.chat.service import ChatService
from app.utilities.auth import get_user_from_token
from app.utilities.db import get_session
from app.utilities.tags import Tags

chat_router = APIRouter(prefix="/chat", tags=[Tags.chat])


@chat_router.post("", description="Send message or create chat", summary="Send Message")
@chat_router.post("/message", description="Send a message in a chat", summary="Create Message")
async def send_message(
    req: Request,
    session=Depends(get_session),
    user: TokenData = Depends(get_user_from_token)
):
    content_type = req.headers.get("content-type", "")
    message = ""
    chat_id = None
    web_search = False
    attachments = []
    files = []

    if "multipart/form-data" in content_type:
        form = await req.form()
        message = str(form.get("message") or "")
        chat_id = form.get("chat_id") or form.get("chatId")
        if isinstance(chat_id, str):
            chat_id = chat_id.strip()
        web_search = str(form.get("web_search") or form.get("webSearch") or "false").lower() in ("true", "1")
        for key, value in form.multi_items():
            if isinstance(value, UploadFile):
                files.append(value)
    else:
        body = await req.json()
        message = body.get("message", "")
        chat_id = body.get("chat_id") or body.get("chatId")
        web_search = bool(body.get("web_search") or body.get("webSearch"))
        attachments = body.get("attachments", [])

    return await ChatService.create_message(
        message=message,
        chat_id=chat_id,
        attachments=attachments,
        uploaded_files=files,
        web_search=web_search,
        session=session,
        user=user
    )


@chat_router.post("/create", description="Create a new chat with an initial message", summary="Create Chat")
async def create_chat(
    message: Annotated[str, Body(embed=True)],
    session=Depends(get_session),
    user: TokenData = Depends(get_user_from_token)
):
    return await ChatService.create_chat(message=message, user=user, session=session)


@chat_router.get("/search", description="Search chats by title or message content", summary="Search Chats")
async def search_chats(
    q: Optional[str] = Query(default=""),
    session=Depends(get_session),
    user: TokenData = Depends(get_user_from_token)
):
    return await ChatService.search_chats(q=q, user=user, session=session)


@chat_router.post("/upload", description="Upload file attachment", summary="Upload File")
async def upload_file(
    file: UploadFile,
    session=Depends(get_session),
    user: TokenData = Depends(get_user_from_token)
):
    return await ChatService.upload_file(file=file, user=user, session=session)


@chat_router.get("/list", description="List user chats", summary="List Chats")
async def get_chat_list(
    session=Depends(get_session),
    user: TokenData = Depends(get_user_from_token)
):
    return await ChatService.get_chat_list(session=session, user=user)


@chat_router.get("/{chat_id}", description="Get chat message history", summary="Get Chat History")
async def get_chat_history(
    chat_id: str,
    session=Depends(get_session),
    user: TokenData = Depends(get_user_from_token)
):
    return await ChatService.get_chat_history(chat_id=chat_id, user=user, session=session)


@chat_router.patch("/{chat_id}/update", description="Update chat title", summary="Update Chat Title")
@chat_router.put("/{chat_id}", description="Update chat title", summary="Update Chat Title")
async def update_chat_title(
    chat_id: str,
    new_title: Annotated[str, Body(embed=True)],
    session=Depends(get_session),
    user: TokenData = Depends(get_user_from_token)
):
    return await ChatService.update_chat_title(chat_id=chat_id, new_title=new_title, session=session)


@chat_router.delete("/{chat_id}/delete", description="Delete chat", summary="Delete Chat")
@chat_router.delete("/{chat_id}", description="Delete chat", summary="Delete Chat")
async def delete_chat(
    chat_id: str,
    session=Depends(get_session),
    user: TokenData = Depends(get_user_from_token)
):
    return await ChatService.delete_chat(chat_id=chat_id, user=user, session=session)
