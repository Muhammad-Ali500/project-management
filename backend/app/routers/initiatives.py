from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, status

from app.models.initiative import Initiative
from app.models.project import Project
from app.schemas.initiative import InitiativeCreate, InitiativeOut, InitiativeUpdate
from app.utils.time import utcnow

router = APIRouter(tags=["initiatives"])


@router.get("/api/projects/{project_id}/initiatives", response_model=list[InitiativeOut])
async def list_initiatives(project_id: PydanticObjectId) -> list[Initiative]:
    project = await Project.get(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return await Initiative.find(Initiative.project_id == project_id).to_list()


@router.post(
    "/api/projects/{project_id}/initiatives",
    response_model=InitiativeOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_initiative(project_id: PydanticObjectId, payload: InitiativeCreate) -> Initiative:
    project = await Project.get(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    initiative = Initiative(project_id=project_id, **payload.model_dump())
    await initiative.insert()
    return initiative


@router.get("/api/initiatives/{initiative_id}", response_model=InitiativeOut)
async def get_initiative(initiative_id: PydanticObjectId) -> Initiative:
    initiative = await Initiative.get(initiative_id)
    if initiative is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    return initiative


@router.put("/api/initiatives/{initiative_id}", response_model=InitiativeOut)
async def update_initiative(
    initiative_id: PydanticObjectId, payload: InitiativeUpdate
) -> Initiative:
    initiative = await Initiative.get(initiative_id)
    if initiative is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    updates = payload.model_dump(exclude_unset=True)
    if updates:
        updates["updated_at"] = utcnow()
        await initiative.set(updates)
    return initiative


@router.delete("/api/initiatives/{initiative_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_initiative(initiative_id: PydanticObjectId) -> None:
    initiative = await Initiative.get(initiative_id)
    if initiative is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    await initiative.delete()
