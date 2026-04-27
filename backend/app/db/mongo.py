from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, TEXT

from app.core.config import settings


class MongoDatabase:
    def __init__(self) -> None:
        self._client: AsyncIOMotorClient | None = None
        self._database: AsyncIOMotorDatabase | None = None

    async def connect(self) -> None:
        if self._client is not None:
            return

        self._client = AsyncIOMotorClient(settings.mongodb_url)
        self._database = self._client[settings.mongodb_db]
        await self._ensure_indexes()

    async def disconnect(self) -> None:
        if self._client is None:
            return

        self._client.close()
        self._client = None
        self._database = None

    def get_collection(self, collection_name: str) -> AsyncIOMotorCollection:
        if self._database is None:
            raise RuntimeError("MongoDB is not connected.")
        return self._database[collection_name]

    async def _ensure_indexes(self) -> None:
        notes = self.get_collection(settings.mongodb_notes_collection)
        await notes.create_index([("note_id", ASCENDING)], unique=True, name="uq_note_id")
        await notes.create_index([("created_at", DESCENDING)], name="idx_created_at_desc")
        await notes.create_index([("updated_at", DESCENDING)], name="idx_updated_at_desc")
        await notes.create_index([("tags", ASCENDING)], name="idx_tags")
        await notes.create_index(
            [("title", TEXT), ("content", TEXT)],
            name="idx_notes_text_search",
        )


mongo_database = MongoDatabase()


@asynccontextmanager
async def mongo_lifespan(_app) -> AsyncIterator[None]:
    await mongo_database.connect()
    try:
        yield
    finally:
        await mongo_database.disconnect()
