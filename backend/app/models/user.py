from typing import Optional, Annotated
from uuid import UUID, uuid4

from pydantic import BaseModel, EmailStr, StringConstraints, ConfigDict
from sqlmodel import SQLModel, Field


class UserBase(SQLModel):
    email: Annotated[EmailStr, StringConstraints(
        min_length=4, max_length=64)] = Field(unique=True, index=True)
    first_name: Optional[Annotated[str, StringConstraints(
        min_length=6, max_length=64)]] = Field()
    last_name: Optional[Annotated[str, StringConstraints(
        min_length=6, max_length=64)]] = Field()


class UserLogin(SQLModel):
    email: Annotated[EmailStr, StringConstraints(min_length=4, max_length=64)]
    password: Annotated[str, StringConstraints(min_length=6, max_length=64)]
    # OpenAPI/Swagger examples
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "email": "test@test.com",
                    "password": "test123",
                }
            ]
        }
    )


class User(UserBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    isActive: bool = False
    hashed_password: str = Field()


class UserCreate(UserBase):
    password: Annotated[str, StringConstraints(min_length=6, max_length=64)]
    # OpenAPI/Swagger examples
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "email": "test@test.com",
                    "first_name": "Marcus",
                    "last_name": "Aurelius",
                    "password": "test123",
                },
            ]
        }
    )


class UserRead(UserBase):
    id: int


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
