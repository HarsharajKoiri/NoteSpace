from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TaskItemDocument(BaseModel):
    text: str = Field(..., min_length=1)
    completed: bool = False


class NoteDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    note_id: str = Field(..., min_length=1)
    title: str | None = None
    content: str = Field(..., min_length=1)
    tags: list[str] = Field(default_factory=list)
    tasks: list[TaskItemDocument] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
