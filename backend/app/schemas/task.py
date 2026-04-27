from datetime import datetime

from pydantic import BaseModel


class AggregatedTaskResponse(BaseModel):
    note_id: str
    note_title: str | None
    text: str
    completed: bool
    created_at: datetime
