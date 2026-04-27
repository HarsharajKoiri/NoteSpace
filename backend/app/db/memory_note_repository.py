from collections.abc import Sequence

from app.db.note_repository import NoteRepository
from app.models.note import Note


class InMemoryNoteRepository(NoteRepository):
    def __init__(self) -> None:
        self._notes: dict[str, Note] = {}

    async def create(self, note: Note) -> Note:
        self._notes[note.id] = note
        return note

    async def list(self) -> Sequence[Note]:
        return sorted(self._notes.values(), key=lambda note: note.created_at, reverse=True)

    async def get_by_id(self, note_id: str) -> Note | None:
        return self._notes.get(note_id)

    async def update(self, note: Note) -> Note:
        self._notes[note.id] = note
        return note

    async def delete(self, note_id: str) -> bool:
        return self._notes.pop(note_id, None) is not None
