import random
import shutil
import string
from pathlib import Path

from fastapi import UploadFile

from app.settings import settings


def is_valid_file_type(content_type: str) -> bool:
    return any([content_type.startswith(file_type) for file_type in settings.VALID_UPLOAD_FILE_TYPES])


def save_file(file: UploadFile, user_id: str):
    upload_dir = Path(f"uploads/{user_id}")
    upload_dir.mkdir(parents=True, exist_ok=True)  # ensure the folder exists

    # first write file to the path
    random_prefix = ''.join(random.choices(string.ascii_letters, k=4))
    file_location = upload_dir / f"{random_prefix}-{file.filename}"
    with file_location.open("wb") as buffer:
        # noinspection PyTypeChecker
        shutil.copyfileobj(file.file, buffer)

    return file_location