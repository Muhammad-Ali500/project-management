from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel

from app.models.enums import Priority, TaskStatus


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: TaskStatus = TaskStatus.TODO
    priority: Priority = Priority.MEDIUM
    assignee: str | None = None
    due_date: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: Priority | None = None
    assignee: str | None = None
    due_date: datetime | None = None


class TaskOut(BaseModel):
    id: PydanticObjectId
    initiative_id: PydanticObjectId
    title: str
    description: str
    status: TaskStatus
    priority: Priority
    assignee: str | None
    due_date: datetime | None
    created_at: datetime
    updated_at: datetime
