from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.settings import settings
from .db import get_session
from ..models.user import TokenData, User

# These would be imported from your config or main module
# You might want to move these to a dedicated config module
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# auth scheme for token
auth_scheme = HTTPBearer(description="Token", auto_error=False)


def get_password_hash(password):
    return pwd_context.hash(password)


# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_db_user(token_data: TokenData, session: AsyncSession):
    # Query the user from database
    user, = await session.exec(select(User).where(User.email == token_data.email).limit(1))
    if user is None:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # Check if user is active
    if not user.isActive:
        raise HTTPException(status_code=400, detail="Inactive user")

    return user


async def get_user_from_token(
        request: Request,
        token: Optional[HTTPAuthorizationCredentials] = Depends(auth_scheme),
        session=Depends(get_session)  # This will be overridden when used
):
    """
    A reusable dependency that validates a JWT token and returns the current user.
    """

    # Move this import inside the function to avoid circular imports
    from ..models.user import TokenData

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    raw_token = None
    if token and token.credentials:
        raw_token = token.credentials
    else:
        raw_token = request.cookies.get("token")
        if not raw_token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                raw_token = auth_header.split(" ")[1]

    if not raw_token:
        raise credentials_exception

    try:
        payload = jwt.decode(raw_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        user_id: str = payload.get("id")
        if email is None or user_id is None:
            raise credentials_exception
        token_data = TokenData(id=user_id, email=email)
        return token_data
    except jwt.PyJWTError:
        raise credentials_exception
