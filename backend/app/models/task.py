from datetime import UTC, datetime

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

from app.models.enums import Priority, TaskStatus


class Task(Document):
    initiative_id: Indexed(PydanticObjectId)
    title: str
    description: str = ""
    status: TaskStatus = TaskStatus.TODO
    priority: Priority = Priority.MEDIUM
    assignee: str | None = None
    due_date: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "tasks"
