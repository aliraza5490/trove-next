import enum
from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4
from pydantic import ConfigDict

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
    chat: "Chat" = Relationship(back_populates="messages")
    role: Role

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
