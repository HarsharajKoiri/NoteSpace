from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass(slots=True)
class TaskItem:
    text: str
    completed: bool = False


@dataclass(slots=True)
class Note:
    id: str
    title: str | None
    content: str
    tags: list[str] = field(default_factory=list)
    tasks: list[TaskItem] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
