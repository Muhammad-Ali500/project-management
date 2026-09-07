import pytest
from beanie import init_beanie
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.main import app
from app.models.initiative import Initiative
from app.models.project import Project
from app.models.task import Task


@pytest.fixture(autouse=True)
async def init_test_db():
    client = AsyncMongoMockClient()
    await init_beanie(
        database=client["test_db"],
        document_models=[Project, Initiative, Task],
    )
    yield


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
