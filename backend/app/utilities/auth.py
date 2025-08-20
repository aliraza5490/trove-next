from passlib.context import CryptContext
from fastapi.security import HTTPBearer
from fastapi import HTTPException, status, Depends
from typing import Optional
from datetime import datetime, timedelta, timezone
from sqlmodel import select
from ..settings import settings
import jwt
from .db import get_session

# These would be imported from your config or main module
# You might want to move these to a dedicated config module
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# auth scheme for token
auth_scheme = HTTPBearer(description="Token")

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

async def get_user_from_token(
    token: str = Depends(auth_scheme),
    session = Depends(get_session)  # This will be overridden when used
):
    """
    A reusable dependency that validates a JWT token and returns the current user.
    
    Usage:
    ```
    @app.get("/protected")
    def protected_route(user = Depends(get_user_from_token)):
        return {"user": user}
    ```
    """

    # Move this import inside the function to avoid circular imports
    from ..models.user import TokenData, User
    

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError as e:
        raise credentials_exception
    
    # Query the user from database
    user = await session.exec(select(User).where(User.email == token_data.email))
    user = user.first()
    if user is None:
        raise credentials_exception
        
    # Check if user is active
    if not user.isActive:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user