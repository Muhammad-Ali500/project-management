from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel

from app.models.enums import ProjectStatus


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    owner: str
    status: ProjectStatus = ProjectStatus.PLANNED


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    owner: str | None = None
    status: ProjectStatus | None = None


class ProjectOut(BaseModel):
    id: PydanticObjectId
    name: str
    description: str
    owner: str
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
