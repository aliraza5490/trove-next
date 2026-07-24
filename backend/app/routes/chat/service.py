import json
from datetime import datetime, timezone
from typing import cast, Optional, List, Dict, Any
from uuid import UUID, uuid4

from fastapi import HTTPException, status, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import selectinload, QueryableAttribute
from sqlmodel import select, asc, desc
from sqlmodel.ext.asyncio.session import AsyncSession

from app.agent import TroveAgent
from app.models.chat import Chat
from app.models.file import File
from app.models.message import Message, Role
from app.models.user import TokenData
from app.settings import settings
from app.utilities.files import is_valid_file_type, save_file
from app.utilities.google_upload import upload_file_to_google
from app.utilities.ocr import extract_text
from app.utilities.vector_store import text_splitter, get_vector_store


class ChatService:
    @classmethod
    async def create_chat(cls, message: str, user: TokenData, session: AsyncSession):
        title_text = await TroveAgent.generate_title(message)
        chat = Chat(title=title_text, user_id=user.id)
        session.add(chat)
        await session.commit()
        await session.refresh(chat)
        return chat

    @classmethod
    async def create_message(
        cls,
        message: str,
        chat_id: Optional[str],
        user: TokenData,
        session: AsyncSession,
        web_search: bool = False,
        attachments: Optional[List[Dict[str, Any]]] = None,
        uploaded_files: Optional[List[UploadFile]] = None
    ):
        chat: Optional[Chat] = None
        if chat_id and chat_id not in ("null", "undefined", ""):
            try:
                chat_uuid = UUID(chat_id)
                chat_result = await session.exec(
                    select(Chat).where(Chat.id == chat_uuid, Chat.user_id == user.id).limit(1)
                )
                chat = chat_result.first()
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid chat_id format")

        if not chat:
            title_text = await TroveAgent.generate_title(message)
            chat = Chat(title=title_text, user_id=user.id)
            session.add(chat)
            await session.commit()
            await session.refresh(chat)

        user_message_doc = Message(
            chat=chat,
            message=message,
            role=Role.USER,
            user_id=user.id
        )
        session.add(user_message_doc)
        await session.commit()
        await session.refresh(user_message_doc)

        attachments_media: List[Dict[str, Any]] = []
        vector_store = await get_vector_store()

        # 1. Handle files uploaded directly in form-data
        if uploaded_files:
            for uploaded_file in uploaded_files:
                if not is_valid_file_type(uploaded_file.content_type):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File must be one of these {settings.VALID_UPLOAD_FILE_TYPES}"
                    )

                if uploaded_file.size > 10 * 1024 * 1024:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="File must be less than 10MB"
                    )

                file_location = await run_in_threadpool(save_file, uploaded_file, str(user.id))
                text = await run_in_threadpool(extract_text, path=str(file_location))
                google_uri = await run_in_threadpool(upload_file_to_google, str(file_location), uploaded_file.content_type)

                file = File(
                    file_name=uploaded_file.filename,
                    file_size=uploaded_file.size or 0,
                    file_path=str(file_location),
                    google_uri=google_uri,
                    mime_type=uploaded_file.content_type,
                    user_id=user.id,
                    message_id=user_message_doc.id
                )
                session.add(file)

                if google_uri:
                    attachments_media.append({
                        "google_uri": google_uri,
                        "mime_type": uploaded_file.content_type,
                        "name": uploaded_file.filename
                    })

                if text:
                    try:
                        docs = text_splitter.create_documents([text])
                        metadata = [{"type": "attachment", "file_id": str(file.id), "chat_id": str(chat.id)} for _ in docs]
                        docs = text_splitter.create_documents([text], metadatas=metadata)
                        await vector_store.aadd_documents(docs, ids=[str(uuid4()) for _ in docs])
                    except Exception as e:
                        print(f"[VectorStore] Document indexing failed: {e}")

        # 2. Handle attachments passed as JSON list (from standalone upload)
        if attachments:
            for att in attachments:
                file_id = att.get("id")
                att_name = att.get("name", "Attached File")
                att_url = att.get("url", "")
                att_size = att.get("size", 0)
                att_google_uri = att.get("googleUri") or att.get("google_uri")
                att_mime_type = att.get("mimeType") or att.get("mime_type")

                db_file = None
                if file_id:
                    try:
                        f_uuid = UUID(file_id)
                        db_file_res = await session.exec(select(File).where(File.id == f_uuid, File.user_id == user.id))
                        db_file = db_file_res.first()
                        if db_file:
                            db_file.message_id = user_message_doc.id
                            session.add(db_file)
                            if not att_google_uri and db_file.google_uri:
                                att_google_uri = db_file.google_uri
                    except Exception:
                        pass

                if not db_file and att_name:
                    db_file = File(
                        file_name=att_name,
                        file_size=att_size or 0,
                        file_path=att_url or "",
                        google_uri=att_google_uri,
                        mime_type=att_mime_type,
                        user_id=user.id,
                        message_id=user_message_doc.id
                    )
                    session.add(db_file)

                # Attempt on-the-fly google upload if local path exists and no google_uri yet
                if not att_google_uri and att_url:
                    local_path = att_url.replace("/api/v1/", "")
                    if local_path.startswith("/"):
                        local_path = local_path[1:]
                    att_google_uri = await run_in_threadpool(upload_file_to_google, local_path, att_mime_type)
                    if att_google_uri and db_file:
                        db_file.google_uri = att_google_uri
                        session.add(db_file)

                if att_google_uri:
                    attachments_media.append({
                        "google_uri": att_google_uri,
                        "mime_type": att_mime_type or "application/octet-stream",
                        "name": att_name
                    })

        chat_messages = await session.exec(
            select(Message).where(Message.chat_id == chat.id).order_by(asc(Message.created_at))
        )
        messages = chat_messages.all()

        context = ""
        upload_context = ""
        try:
            context_docs = await vector_store.asimilarity_search(query=message, k=5, filter={"type": "upload"})
            context = " ".join([doc.page_content for doc in context_docs])
        except Exception as e:
            print(f"[VectorStore] Similarity search (upload) failed: {e}")

        try:
            uploaded_docs = await vector_store.asimilarity_search(
                query=message, k=5, filter={"type": "attachment", "chat_id": str(chat.id)}
            )
            upload_context = " ".join([doc.page_content for doc in uploaded_docs])
        except Exception as e:
            print(f"[VectorStore] Similarity search (attachment) failed: {e}")

        await session.commit()
        created_chat_id = str(chat.id)

        async def generate():
            full_response = ""
            try:
                async for chunk in TroveAgent.stream_response(
                    message=message,
                    history_messages=[
                        {
                            "role": m.role.value if hasattr(m.role, "value") else str(m.role),
                            "message": m.message
                        }
                        for m in messages[:-1] # history except current prompt
                    ],
                    web_search=web_search,
                    context_text=context,
                    upload_context=upload_context,
                    attachments_media=attachments_media,
                ):
                    full_response += chunk
                    event = {
                        "content": chunk,
                        "type": "message"
                    }
                    yield f"data: {json.dumps(event)}\n\n"
            except Exception as err:
                err_msg = f"\n\n**Error:** Unable to generate response ({err}). Please verify API credentials in `backend/.env`."
                full_response += err_msg
                event = {
                    "content": err_msg,
                    "type": "message"
                }
                yield f"data: {json.dumps(event)}\n\n"

            ai_message = Message(
                chat_id=UUID(created_chat_id),
                message=full_response,
                role=Role.ASSISTANT,
                user_id=user.id
            )
            session.add(ai_message)
            await session.commit()
            event = {
                "content": created_chat_id,
                "type": "end"
            }
            yield f"data: {json.dumps(event)}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "X-Chat-Id": created_chat_id,
                "Access-Control-Expose-Headers": "X-Chat-Id",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        )

    @classmethod
    async def search_chats(cls, q: str, user: TokenData, session: AsyncSession):
        query_str = (q or "").strip()
        if not query_str:
            result = await session.exec(
                select(Chat).where(Chat.user_id == user.id).order_by(desc(Chat.created_at))
            )
            chats = result.all()
        else:
            statement = (
                select(Chat)
                .outerjoin(Message, Message.chat_id == Chat.id)
                .where(
                    Chat.user_id == user.id,
                    (Chat.title.ilike(f"%{query_str}%")) | (Message.message.ilike(f"%{query_str}%"))
                )
                .group_by(Chat.id)
                .order_by(desc(Chat.updated_at))
                .limit(20)
            )
            result = await session.exec(statement)
            chats = result.all()

        formatted_chats = []
        for chat in chats:
            last_msg_q = await session.exec(
                select(Message)
                .where(Message.chat_id == chat.id, Message.role != Role.SYSTEM)
                .order_by(desc(Message.created_at))
                .limit(1)
            )
            last_msg = last_msg_q.first()
            formatted_chats.append({
                "id": str(chat.id),
                "title": chat.title,
                "updatedAt": chat.updated_at.isoformat() if chat.updated_at else datetime.now(timezone.utc).isoformat(),
                "lastMessage": last_msg.message if last_msg else None,
            })
        return {"chats": formatted_chats}

    @classmethod
    async def upload_file(cls, file: UploadFile, user: TokenData, session: AsyncSession):
        if not is_valid_file_type(file.content_type):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File must be one of {settings.VALID_UPLOAD_FILE_TYPES}"
            )
        if file.size and file.size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be less than 10MB"
            )

        file_location = await run_in_threadpool(save_file, file, str(user.id))
        rel_path = str(file_location).replace("\\", "/")
        file_url = f"/api/v1/{rel_path}"

        google_uri = await run_in_threadpool(upload_file_to_google, str(file_location), file.content_type)

        db_file = File(
            file_name=file.filename,
            file_size=file.size or 0,
            file_path=str(file_location),
            google_uri=google_uri,
            mime_type=file.content_type,
            user_id=user.id,
        )
        session.add(db_file)
        await session.commit()
        await session.refresh(db_file)

        return {
            "id": str(db_file.id),
            "name": file.filename,
            "url": file_url,
            "googleUri": google_uri,
            "mimeType": file.content_type,
            "size": file.size or 0,
        }

    @classmethod
    async def get_chat_history(cls, chat_id: str, user: TokenData, session: AsyncSession):
        try:
            chat_uuid = UUID(chat_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid chat_id format")

        chat_query = await session.exec(select(Chat).where(Chat.id == chat_uuid, Chat.user_id == user.id).limit(1))
        chat = chat_query.first()
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

        msg_query = await session.exec(
            select(Message).options(selectinload(cast(QueryableAttribute, Message.attachments))).where(
                Message.chat_id == chat.id,
                Message.role != Role.SYSTEM)
            .order_by(asc(Message.created_at))
        )
        messages = msg_query.all()

        return {
            "chat": chat,
            "messages": [
                {
                    "id": str(m.id),
                    "chat_id": str(m.chat_id) if m.chat_id else None,
                    "message": m.message,
                    "content": m.message,
                    "role": m.role.value if hasattr(m.role, "value") else str(m.role),
                    "attachments": [
                        {
                            "id": str(att.id),
                            "name": att.file_name,
                            "url": f"/api/v1/{att.file_path.replace('\\', '/')}" if att.file_path and not att.file_path.startswith("http") else (att.file_path or ""),
                            "googleUri": att.google_uri,
                            "mimeType": att.mime_type,
                            "size": att.file_size
                        }
                        for att in (m.attachments or [])
                    ],
                }
                for m in messages
            ],
        }

    @classmethod
    async def get_chat_list(cls, user: TokenData, session: AsyncSession):
        result = await session.exec(select(Chat).where(Chat.user_id == user.id).order_by(desc(Chat.created_at)))
        chats = result.all()
        return chats

    @classmethod
    async def update_chat_title(cls, chat_id: str, new_title: str, session: AsyncSession):
        try:
            chat_uuid = UUID(chat_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid chat_id format")

        chat_result = await session.exec(select(Chat).where(Chat.id == chat_uuid))
        chat = chat_result.first()
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

        chat.title = new_title
        session.add(chat)
        await session.commit()
        return chat

    @classmethod
    async def delete_chat(cls, chat_id: str, user: TokenData, session: AsyncSession):
        try:
            chat_uuid = UUID(chat_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid chat_id format")

        chat_result = await session.exec(select(Chat).where(Chat.id == chat_uuid, Chat.user_id == user.id))
        chat = chat_result.first()
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

        await session.delete(chat)
        await session.commit()
        return {"success": True}
