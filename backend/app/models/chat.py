from sqlmodel import SQLModel, Field, Relationship
from pydantic import StringConstraints, ConfigDict
from typing import Optional, Annotated
from uuid import UUID, uuid4

class ChatBase(SQLModel):
    title: Optional[Annotated[str, StringConstraints(min_length=6, max_length=64)]] = Field()

class Chat(ChatBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    messages: list["Message"] = Relationship(back_populates="chat")
    user_id: UUID = Field(foreign_key="user.id")

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
