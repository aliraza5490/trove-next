from sqlmodel import Column, DateTime, SQLModel, Field, Relationship, func
from pydantic import StringConstraints, ConfigDict
from typing import Optional, Annotated
from uuid import UUID, uuid4
from datetime import datetime
from datetime import timezone

class ChatBase(SQLModel):
    title: Optional[Annotated[str, StringConstraints(min_length=6, max_length=64)]] = Field()

class Chat(ChatBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    # Use selectin loading to fetch related messages eagerly in async contexts
    messages: list["Message"] = Relationship(
        back_populates="chat",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"}
    )
    user_id: UUID = Field(foreign_key="user.id")
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
    
class ChatCreate(ChatBase):
    # OpenAPI/Swagger examples
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "title": "chat title 1",
                },
            ]
        }
    )

from .message import Message
