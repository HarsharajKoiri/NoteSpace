from collections.abc import Sequence
from typing import Protocol

from app.models.note import Note


class NoteRepository(Protocol):
    async def create(self, note: Note) -> Note:
        ...

    async def list(self) -> Sequence[Note]:
        ...

    async def get_by_id(self, note_id: str) -> Note | None:
        ...

    async def update(self, note: Note) -> Note:
        ...

    async def delete(self, note_id: str) -> bool:
        ...
