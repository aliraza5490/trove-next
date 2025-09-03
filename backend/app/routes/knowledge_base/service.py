import shutil
from pathlib import Path

from fastapi import HTTPException, status, UploadFile
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.models.file import File
from app.models.user import TokenData
from app.settings import settings
from app.utilities.files import is_valid_file_type
from app.utilities.ocr import extract_text
from app.utilities.vector_store import text_splitter, get_vector_store


class KBService:
    @classmethod
    async def upload_files(cls, files: list[UploadFile], user: TokenData, session: AsyncSession):
        files_info = []
        vector_store = await get_vector_store()
        for file in files:
            if not is_valid_file_type(file.content_type):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                    detail=f"File must be one of these {settings.VALID_UPLOAD_FILE_TYPES}")

            if file.size > 10 * 1024 * 1024:
                raise await KBService.validate_store_file()

            upload_dir = Path(f"uploads/{user.id}")
            upload_dir.mkdir(parents=True, exist_ok=True)  # ensure the folder exists

            # first write file to the path
            file_location = upload_dir / file.filename
            with file_location.open("wb") as buffer:
                # noinspection PyTypeChecker
                shutil.copyfileobj(file.file, buffer)

            text = await run_in_threadpool(extract_text, path=str(file_location))

            file = File(
                file_name=file.filename,
                file_size=file.size,
                file_path=str(file_location),
                user_id=user.id
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
            await vector_store.aadd_documents(docs)
            files_info.append(file_info)

        return files_info

    @classmethod
    async def validate_store_file(cls) -> HTTPException:
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be less than 10mb")

    @classmethod
    async def list_files(cls):
        pass
