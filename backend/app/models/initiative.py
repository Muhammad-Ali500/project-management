from datetime import UTC, datetime

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

from app.models.enums import InitiativeStatus, Priority


class Initiative(Document):
    project_id: Indexed(PydanticObjectId)
    title: str
    description: str = ""
    status: InitiativeStatus = InitiativeStatus.NOT_STARTED
    priority: Priority = Priority.MEDIUM
    due_date: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "initiatives"
