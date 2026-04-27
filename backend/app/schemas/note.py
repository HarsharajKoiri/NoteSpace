from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TaskItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    text: str
    completed: bool = False


class RelatedNoteResponse(BaseModel):
    id: str
    title: str | None
    tags: list[str]
    shared_tags: list[str]
    shared_keywords: list[str]


class NoteBase(BaseModel):
    title: str | None = Field(default=None, max_length=120)
    content: str = Field(..., min_length=1, max_length=5000)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()
        return cleaned or None

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Content cannot be empty.")
        return cleaned


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=120)
    content: str = Field(..., min_length=1, max_length=5000)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()
        return cleaned or None

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Content cannot be empty.")
        return cleaned


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str | None
    content: str
    tags: list[str]
    tasks: list[TaskItemResponse]
    related_notes: list[RelatedNoteResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
