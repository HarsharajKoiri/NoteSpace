from collections.abc import Sequence
from datetime import timezone

from motor.motor_asyncio import AsyncIOMotorCollection

from app.core.config import settings
from app.db.mongo import mongo_database
from app.db.note_repository import NoteRepository
from app.models.note import Note, TaskItem
from app.models.note_document import NoteDocument


class MongoNoteRepository(NoteRepository):
    def __init__(self, collection_name: str | None = None) -> None:
        self.collection_name = collection_name or settings.mongodb_notes_collection

    @property
    def collection(self) -> AsyncIOMotorCollection:
        return mongo_database.get_collection(self.collection_name)

    async def create(self, note: Note) -> Note:
        await self.collection.insert_one(self._to_document(note))
        return note

    async def list(self) -> Sequence[Note]:
        documents = await self.collection.find().sort("created_at", -1).to_list(length=None)
        return [self._to_model(document) for document in documents]

    async def get_by_id(self, note_id: str) -> Note | None:
        document = await self.collection.find_one({"note_id": note_id})
        if document is None:
            return None
        return self._to_model(document)

    async def update(self, note: Note) -> Note:
        await self.collection.replace_one(
            {"note_id": note.id},
            self._to_document(note),
            upsert=False,
        )
        return note

    async def delete(self, note_id: str) -> bool:
        result = await self.collection.delete_one({"note_id": note_id})
        return result.deleted_count > 0

    def _to_document(self, note: Note) -> dict:
        document = NoteDocument(
            note_id=note.id,
            title=note.title,
            content=note.content,
            tags=note.tags,
            tasks=[
                {
                    "text": task.text,
                    "completed": task.completed,
                }
                for task in note.tasks
            ],
            created_at=note.created_at.astimezone(timezone.utc),
            updated_at=note.updated_at.astimezone(timezone.utc),
        )
        return document.model_dump()

    def _to_model(self, document: dict) -> Note:
        parsed = NoteDocument.model_validate(document)
        return Note(
            id=parsed.note_id,
            title=parsed.title,
            content=parsed.content,
            tags=parsed.tags,
            tasks=[
                TaskItem(
                    text=task.text,
                    completed=task.completed,
                )
                for task in parsed.tasks
            ],
            created_at=parsed.created_at,
            updated_at=parsed.updated_at,
        )
