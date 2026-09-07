from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel

from app.models.enums import InitiativeStatus, Priority


class InitiativeCreate(BaseModel):
    title: str
    description: str = ""
    status: InitiativeStatus = InitiativeStatus.NOT_STARTED
    priority: Priority = Priority.MEDIUM
    due_date: datetime | None = None


class InitiativeUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: InitiativeStatus | None = None
    priority: Priority | None = None
    due_date: datetime | None = None


class InitiativeOut(BaseModel):
    id: PydanticObjectId
    project_id: PydanticObjectId
    title: str
    description: str
    status: InitiativeStatus
    priority: Priority
    due_date: datetime | None
    created_at: datetime
    updated_at: datetime
