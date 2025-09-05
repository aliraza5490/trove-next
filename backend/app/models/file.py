from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Column, DateTime, SQLModel, Field, func, Relationship


class FileBase(SQLModel):
    file_name: str = Field()
    file_size: int = Field()
    file_path: str = Field()


class File(FileBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    message_id: Optional[UUID] = Field(default=None, foreign_key="message.id")
    message: Optional["Message"] = Relationship(back_populates="attachments")
    created_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True), server_default=func.now()
        ),
    )
    updated_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
        ),
    )


from app.models.message import Message
