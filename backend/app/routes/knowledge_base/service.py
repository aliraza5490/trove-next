from typing import List
from uuid import uuid4

from fastapi import HTTPException, status, UploadFile
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.models.file import File
from app.models.user import TokenData
from app.settings import settings
from app.utilities.files import is_valid_file_type, save_file
from app.utilities.ocr import extract_text
from app.utilities.vector_store import text_splitter, get_vector_store


class KBService:
    @classmethod
    async def upload_files(cls, files: List[UploadFile], user: TokenData, session: AsyncSession):
        files_info = []
        vector_store = await get_vector_store()
        for file in files:
            if not is_valid_file_type(file.content_type):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                    detail=f"File must be one of these {settings.VALID_UPLOAD_FILE_TYPES}")

            if file.size > 10 * 1024 * 1024:
                raise await KBService.validate_store_file()

            file_location = await run_in_threadpool(save_file, file, user.id)

            text = await run_in_threadpool(extract_text, path=str(file_location))

            file = File(
                file_name=file.filename,
                file_size=file.size,
                file_path=str(file_location),
                user_id=user.id,
            )
            session.add(file)
            await session.commit()

            docs = text_splitter.create_documents([text])
            metadata = [{"type": "upload", "file_id": str(file.id)} for _ in docs]
            docs = text_splitter.create_documents([text], metadatas=metadata)
            file_info = {
                "text": text,
                "file_location": file_location,
                "documents": docs,
            }
            await vector_store.aadd_documents(docs, ids=[str(uuid4()) for _ in docs])
            files_info.append(file_info)

        return files_info

    @classmethod
    async def validate_store_file(cls) -> HTTPException:
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be less than 10mb")

    @classmethod
    async def list_files(cls, user: TokenData, session: AsyncSession, page_num: int = 1):
        try:
            page_size = 15
            offset_value = (page_num - 1) * page_size
            files = await session.exec(
                select(File).where(File.user_id == user.id).offset(offset_value).limit(page_size))
            total = await session.exec(select(func.count(File.id)).offset(page_size))

            return {
                "data": files.all(),
                "total": total.one(),
            }
        except:
            return {"data": [], "total": 0}

    @classmethod
    async def delete_file(cls, file_id: str, user: TokenData, session: AsyncSession):
        files = await session.exec(select(File).where(File.user_id == user.id, File.id == file_id).limit(1))
        files = files.first()

        if not files:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "File Not Found")

        await session.delete(files[0])
        await session.commit()
        return {
            "message": "File Deleted",
        }

    @classmethod
    async def delete_files(cls, file_ids: list[str], user: TokenData, session: AsyncSession):
        files = await session.exec(select(File).where(File.user_id == user.id, File.id.in_(file_ids)))
        files = files.all()

        if not files:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "File Not Found")

        await session.delete(files[0])
        await session.commit()
        return {
            "message": "Files Deleted",
        }
