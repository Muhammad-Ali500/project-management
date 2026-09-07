from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, status

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from app.utils.time import utcnow

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
async def list_projects() -> list[Project]:
    return await Project.find_all().to_list()


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate) -> Project:
    project = Project(**payload.model_dump())
    await project.insert()
    return project


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: PydanticObjectId) -> Project:
    project = await Project.get(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(project_id: PydanticObjectId, payload: ProjectUpdate) -> Project:
    project = await Project.get(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    updates = payload.model_dump(exclude_unset=True)
    if updates:
        updates["updated_at"] = utcnow()
        await project.set(updates)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: PydanticObjectId) -> None:
    project = await Project.get(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    await project.delete()
