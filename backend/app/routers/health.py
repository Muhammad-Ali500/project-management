from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.database import ping_database

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> JSONResponse:
    db_ok = await ping_database()
    payload = {"status": "ok" if db_ok else "degraded", "database": "up" if db_ok else "down"}
    code = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(content=payload, status_code=code)
