from fastapi import APIRouter, Depends

from .service import AuthService
from app.models.user import User, UserLogin, UserCreate, TokenData
from app.utilities.auth import get_user_from_token
from app.utilities.db import get_session
from app.utilities.tags import Tags

auth_router = APIRouter(prefix="/auth", tags=[Tags.users])


@auth_router.post("/register")
async def register(user: UserCreate, session = Depends(get_session)):
    return await AuthService.register(user, session)


@auth_router.post("/protected")
def protected(user: TokenData = Depends(get_user_from_token)):
    return AuthService.protected(user)

@auth_router.post("/login")
async def login(user: UserLogin, session = Depends(get_session)):
    return await AuthService.login(user=user, session=session)
