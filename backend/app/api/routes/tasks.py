from fastapi import APIRouter, Depends

from app.schemas.task import AggregatedTaskResponse
from app.services.note_service import NoteService, get_note_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[AggregatedTaskResponse])
async def list_tasks(
    note_service: NoteService = Depends(get_note_service),
) -> list[AggregatedTaskResponse]:
    return await note_service.list_tasks()
