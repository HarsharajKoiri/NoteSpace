import re

from app.models.note import TaskItem

TAG_RULES: dict[str, tuple[str, ...]] = {
    "learning": ("learn", "learning", "study", "read", "research"),
    "ideas": ("idea", "ideas", "build", "startup", "concept"),
    "tasks": ("buy", "purchase", "get", "do", "finish", "complete", "submit", "call"),
}

TASK_KEYWORDS = ("do", "finish", "complete", "buy", "submit", "call")
SENTENCE_SPLIT_PATTERN = re.compile(r"(?<=[.!?])\s+|\n+")
WORD_PATTERN_TEMPLATE = r"\b{keyword}\b"


class NoteEnrichmentService:
    def extract_tags(self, text: str) -> list[str]:
        normalized_text = text.lower()
        detected_tags: list[str] = []

        for tag, keywords in TAG_RULES.items():
            if any(self._contains_keyword(normalized_text, keyword) for keyword in keywords):
                detected_tags.append(tag)

        return detected_tags

    def extract_tasks(self, text: str) -> list[TaskItem]:
        tasks: list[TaskItem] = []

        for sentence in self._split_sentences(text):
            normalized_sentence = sentence.lower()
            if any(self._contains_keyword(normalized_sentence, keyword) for keyword in TASK_KEYWORDS):
                tasks.append(TaskItem(text=sentence, completed=False))

        return tasks

    def _split_sentences(self, text: str) -> list[str]:
        parts = SENTENCE_SPLIT_PATTERN.split(text.strip())
        return [part.strip() for part in parts if part.strip()]

    def _contains_keyword(self, text: str, keyword: str) -> bool:
        return re.search(WORD_PATTERN_TEMPLATE.format(keyword=re.escape(keyword)), text) is not None
