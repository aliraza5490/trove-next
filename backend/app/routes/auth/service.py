from datetime import timedelta

from fastapi import status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.user import TokenData, UserCreate, UserLogin
from app.models.user import User as UserModel
from app.settings import settings
from app.utilities.auth import pwd_context, create_access_token


class AuthService:
    @classmethod
    async def register(cls, user: UserCreate, session: AsyncSession):
        # Check if user with this email already exists
        existing_user = await session.execute(select(UserModel).where(
            UserModel.email == user.email
        ))

        existing_user = existing_user.first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user with hashed password
        new_user = UserModel(
            email=user.email,
            hashed_password=pwd_context.hash(user.password),
            first_name=user.first_name,
            last_name=user.last_name,
            isActive=True
        )
        
        # Add to database and commit
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)

        return {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.first_name,
            "message": "User registered successfully"
        }
    
    @classmethod
    def protected(cls, user: TokenData):
        return {"message": "Protected route accessed", "user": user.model_dump(exclude=set("hashed_password"))}

    @classmethod
    async def login(cls, user: UserLogin, session: AsyncSession):
        user_data = await session.execute(select(UserModel).where(
            UserModel.email == user.email, 
            UserModel.isActive == True
        ))
        user_data = user_data.first()
        if user_data:
            user_data = user_data[0]

        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        does_pass_match = pwd_context.verify(user.password, user_data.hashed_password)
        if not does_pass_match:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"id": str(user_data.id), "email": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
