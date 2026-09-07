import logging

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.models.initiative import Initiative
from app.models.project import Project
from app.models.task import Task

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient | None = None


async def connect_to_mongo() -> None:
    global client
    client = AsyncIOMotorClient(settings.mongo_uri)
    await init_beanie(
        database=client[settings.db_name],
        document_models=[Project, Initiative, Task],
    )
    logger.info("Connected to MongoDB at %s (db=%s)", settings.mongo_uri, settings.db_name)


async def close_mongo_connection() -> None:
    if client is not None:
        client.close()
        logger.info("MongoDB connection closed")


async def ping_database() -> bool:
    if client is None:
        return False
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        logger.exception("MongoDB ping failed")
        return False
