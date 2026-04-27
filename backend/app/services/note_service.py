import re
from datetime import datetime, timezone
from uuid import uuid4

from app.db.mongo_note_repository import MongoNoteRepository
from app.db.note_repository import NoteRepository
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate, RelatedNoteResponse
from app.schemas.task import AggregatedTaskResponse
from app.services.note_enrichment_service import NoteEnrichmentService

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "how",
    "i",
    "in",
    "into",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "we",
    "with",
    "you",
}
WORD_PATTERN = re.compile(r"\b[a-zA-Z]{4,}\b")


class NoteNotFoundError(Exception):
    """Raised when a note cannot be found."""


class NoteService:
    def __init__(
        self,
        repository: NoteRepository,
        enrichment_service: NoteEnrichmentService | None = None,
    ) -> None:
        self.repository = repository
        self.enrichment_service = enrichment_service or NoteEnrichmentService()

    async def create_note(self, payload: NoteCreate) -> NoteResponse:
        now = datetime.now(timezone.utc)
        combined_text = self._combine_note_text(payload.title, payload.content)
        note = Note(
            id=str(uuid4()),
            title=payload.title,
            content=payload.content,
            tags=self.enrichment_service.extract_tags(combined_text),
            tasks=self.enrichment_service.extract_tasks(payload.content),
            created_at=now,
            updated_at=now,
        )
        stored_note = await self.repository.create(note)
        all_notes = list(await self.repository.list())
        return self._build_note_response(stored_note, all_notes)

    async def list_notes(self) -> list[NoteResponse]:
        notes = await self.repository.list()
        all_notes = list(notes)
        return [self._build_note_response(note, all_notes) for note in all_notes]

    async def get_note(self, note_id: str) -> NoteResponse:
        all_notes = list(await self.repository.list())
        note = next((item for item in all_notes if item.id == note_id), None)
        if note is None:
            raise NoteNotFoundError(f"Note '{note_id}' was not found.")
        return self._build_note_response(note, all_notes)

    async def search_notes(self, query: str) -> list[NoteResponse]:
        normalized_query = query.strip().lower()
        all_notes = list(await self.repository.list())
        matching_notes = [
            note
            for note in all_notes
            if self._matches_query(note, normalized_query)
        ]
        return [self._build_note_response(note, all_notes) for note in matching_notes]

    async def list_tasks(self) -> list[AggregatedTaskResponse]:
        notes = await self.repository.list()
        aggregated_tasks: list[AggregatedTaskResponse] = []

        for note in notes:
            for task in note.tasks:
                aggregated_tasks.append(
                    AggregatedTaskResponse(
                        note_id=note.id,
                        note_title=note.title,
                        text=task.text,
                        completed=task.completed,
                        created_at=note.created_at,
                    )
                )

        return aggregated_tasks

    async def update_note(self, note_id: str, payload: NoteUpdate) -> NoteResponse:
        note = await self.repository.get_by_id(note_id)
        if note is None:
            raise NoteNotFoundError(f"Note '{note_id}' was not found.")
        existing_note = note

        combined_text = self._combine_note_text(payload.title, payload.content)
        updated_note = Note(
            id=existing_note.id,
            title=payload.title,
            content=payload.content,
            tags=self.enrichment_service.extract_tags(combined_text),
            tasks=self.enrichment_service.extract_tasks(payload.content),
            created_at=existing_note.created_at,
            updated_at=datetime.now(timezone.utc),
        )
        stored_note = await self.repository.update(updated_note)
        all_notes = list(await self.repository.list())
        return self._build_note_response(stored_note, all_notes)

    async def delete_note(self, note_id: str) -> None:
        deleted = await self.repository.delete(note_id)
        if not deleted:
            raise NoteNotFoundError(f"Note '{note_id}' was not found.")

    def _combine_note_text(self, title: str | None, content: str) -> str:
        if title:
            return f"{title}\n{content}"
        return content

    def _matches_query(self, note: Note, normalized_query: str) -> bool:
        searchable_text = " ".join(
            [
                note.title or "",
                note.content,
                " ".join(note.tags),
            ]
        ).lower()
        return normalized_query in searchable_text

    def _build_note_response(self, note: Note, all_notes: list[Note]) -> NoteResponse:
        return NoteResponse(
            id=note.id,
            title=note.title,
            content=note.content,
            tags=note.tags,
            tasks=note.tasks,
            related_notes=self._find_related_notes(note, all_notes),
            created_at=note.created_at,
            updated_at=note.updated_at,
        )

    def _find_related_notes(self, note: Note, all_notes: list[Note]) -> list[RelatedNoteResponse]:
        note_keywords = self._extract_keywords(note)
        ranked_notes: list[tuple[int, RelatedNoteResponse]] = []

        for candidate in all_notes:
            if candidate.id == note.id:
                continue

            shared_tags = sorted(set(note.tags) & set(candidate.tags))
            candidate_keywords = self._extract_keywords(candidate)
            shared_keywords = sorted(note_keywords & candidate_keywords)

            score = len(shared_tags) * 3 + len(shared_keywords)
            if score == 0:
                continue

            ranked_notes.append(
                (
                    score,
                    RelatedNoteResponse(
                        id=candidate.id,
                        title=candidate.title,
                        tags=candidate.tags,
                        shared_tags=shared_tags[:3],
                        shared_keywords=shared_keywords[:4],
                    ),
                )
            )

        ranked_notes.sort(
            key=lambda item: (
                -item[0],
                -(len(item[1].shared_tags) + len(item[1].shared_keywords)),
                item[1].title or "",
            )
        )
        return [item[1] for item in ranked_notes[:3]]

    def _extract_keywords(self, note: Note) -> set[str]:
        source_text = self._combine_note_text(note.title, note.content).lower()
        return {
            word
            for word in WORD_PATTERN.findall(source_text)
            if word not in STOPWORDS and word not in note.tags
        }


note_repository = MongoNoteRepository()


def get_note_service() -> NoteService:
    return NoteService(note_repository)
