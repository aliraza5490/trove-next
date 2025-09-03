from app.settings import settings


def is_valid_file_type(content_type: str) -> bool:
    return any([content_type.startswith(file_type) for file_type in settings.VALID_UPLOAD_FILE_TYPES])
