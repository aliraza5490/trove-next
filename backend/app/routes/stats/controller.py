from fastapi import APIRouter, Depends

from app.models.user import TokenData
from app.routes.stats.service import StatsService
from app.utilities.auth import get_user_from_token
from app.utilities.db import get_session
from app.utilities.tags import Tags

stats_router = APIRouter(prefix="/stats", tags=[Tags.stats])


@stats_router.get("/", description="Stats", summary="Stats")
async def stats(session=Depends(get_session), user: TokenData = Depends(get_user_from_token)):
    return await StatsService.get_stats(user, session)
