from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.chat import Chat
from app.models.file import File
from app.models.message import Message
from app.models.user import TokenData


class StatsService:
    @classmethod
    async def get_stats(cls, user: TokenData, session: AsyncSession):
        try:
            total_files = await session.exec(select(func.count(File.id)).where(File.user_id == user.id))
            total_messages = await session.exec(select(func.count(Message.id)).where(Message.user_id == user.id))
            total_chats = await session.exec(select(func.count(Chat.id)).where(Chat.user_id == user.id))

            storage_query = await session.exec(
                select(func.coalesce(func.sum(File.file_size), 0)).where(File.user_id == user.id)
            )
            total_storage = storage_query.one()

            return {
                "total_files": total_files.one(),
                "total_chats": total_chats.one(),
                "total_messages": total_messages.one(),
                "storage": total_storage,
            }
        except Exception as e:
            print(e)
            return {"total_files": 0, "total_docs": 0, "total_messages": 0, "storage": 0}
