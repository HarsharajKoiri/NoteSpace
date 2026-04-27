from fastapi import APIRouter, Depends, Query

from app.schemas.note import NoteResponse
from app.services.note_service import NoteService, get_note_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=list[NoteResponse])
async def search_notes(
    q: str = Query(..., min_length=1, description="Search query for note content and tags."),
    note_service: NoteService = Depends(get_note_service),
) -> list[NoteResponse]:
    return await note_service.search_notes(q)
