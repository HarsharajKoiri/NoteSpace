from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.memory_note_repository import InMemoryNoteRepository
from app.db.mongo import mongo_database
from app.services.note_service import NoteService, get_note_service


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    test_repository = InMemoryNoteRepository()

    def override_note_service() -> NoteService:
        return NoteService(test_repository)

    async def fake_connect() -> None:
        return None

    async def fake_disconnect() -> None:
        return None

    app.dependency_overrides[get_note_service] = override_note_service

    original_connect = mongo_database.connect
    original_disconnect = mongo_database.disconnect
    mongo_database.connect = fake_connect
    mongo_database.disconnect = fake_disconnect

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    mongo_database.connect = original_connect
    mongo_database.disconnect = original_disconnect
