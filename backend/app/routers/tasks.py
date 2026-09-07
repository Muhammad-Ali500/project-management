from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, status

from app.models.initiative import Initiative
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate
from app.utils.time import utcnow

router = APIRouter(tags=["tasks"])


@router.get("/api/initiatives/{initiative_id}/tasks", response_model=list[TaskOut])
async def list_tasks(initiative_id: PydanticObjectId) -> list[Task]:
    initiative = await Initiative.get(initiative_id)
    if initiative is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    return await Task.find(Task.initiative_id == initiative_id).to_list()


@router.post(
    "/api/initiatives/{initiative_id}/tasks",
    response_model=TaskOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(initiative_id: PydanticObjectId, payload: TaskCreate) -> Task:
    initiative = await Initiative.get(initiative_id)
    if initiative is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    task = Task(initiative_id=initiative_id, **payload.model_dump())
    await task.insert()
    return task


@router.get("/api/tasks/{task_id}", response_model=TaskOut)
async def get_task(task_id: PydanticObjectId) -> Task:
    task = await Task.get(task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.put("/api/tasks/{task_id}", response_model=TaskOut)
async def update_task(task_id: PydanticObjectId, payload: TaskUpdate) -> Task:
    task = await Task.get(task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    updates = payload.model_dump(exclude_unset=True)
    if updates:
        updates["updated_at"] = utcnow()
        await task.set(updates)
    return task


@router.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: PydanticObjectId) -> None:
    task = await Task.get(task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    await task.delete()
