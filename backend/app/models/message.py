import enum
from typing import Optional
from sqlmodel import Column, DateTime, SQLModel, Field, Relationship, func
from uuid import UUID, uuid4
from pydantic import ConfigDict
from datetime import datetime, timezone

class Role(str, enum.Enum):  # str + Enum = easier JSON serialization
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class MessageBase(SQLModel):
    chat_id: UUID | None = Field(foreign_key="chat.id", default=None)
    message: str = Field()


class Message(MessageBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    chat_id: UUID = Field(foreign_key="chat.id", ondelete="CASCADE")
    # Avoid async lazy-load issues by using selectin loading
    chat: "Chat" = Relationship(back_populates="messages", sa_relationship_kwargs={"lazy": "selectin"})
    role: Role
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


class MessageCreate(MessageBase):
    # OpenAPI/Swagger examples
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "chat_id": "uuid123",
                    "message": "lorem ipsum...",
                },
            ]
        }
    )
    
    
from ..models.chat import Chat
