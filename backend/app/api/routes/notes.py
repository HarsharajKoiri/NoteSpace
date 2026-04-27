from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate
from app.services.note_service import NoteNotFoundError, NoteService
from app.services.note_service import get_note_service

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    payload: NoteCreate,
    note_service: NoteService = Depends(get_note_service),
) -> NoteResponse:
    return await note_service.create_note(payload)


@router.get("", response_model=list[NoteResponse])
async def list_notes(
    note_service: NoteService = Depends(get_note_service),
) -> list[NoteResponse]:
    return await note_service.list_notes()


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    note_service: NoteService = Depends(get_note_service),
) -> NoteResponse:
    try:
        return await note_service.get_note(note_id)
    except NoteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    payload: NoteUpdate,
    note_service: NoteService = Depends(get_note_service),
) -> NoteResponse:
    try:
        return await note_service.update_note(note_id, payload)
    except NoteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    note_service: NoteService = Depends(get_note_service),
) -> Response:
    try:
        await note_service.delete_note(note_id)
    except NoteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)
