from datetime import UTC, datetime

from beanie import Document
from pydantic import Field

from app.models.enums import ProjectStatus


class Project(Document):
    name: str
    description: str = ""
    status: ProjectStatus = ProjectStatus.PLANNED
    owner: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "projects"
