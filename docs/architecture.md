# System Architecture

## Overview

`SECOND BRAIN` is split into two deployable applications:

- `frontend/`: Next.js client for capture, timeline, search, and task views
- `backend/`: FastAPI service for note CRUD, rule-based enrichment, and search

MongoDB is the system of record for notes and extracted tasks.

## Folder Layout

```text
second-brain/
  backend/
    app/
      api/
        routes/
      core/
      db/
      models/
      schemas/
      services/
      utils/
      main.py
    requirements.txt
    .env.example
  frontend/
    src/
      app/
      components/
      hooks/
      lib/
      services/
      types/
      utils/
    public/
    package.json
    .env.local.example
  docs/
    architecture.md
  README.md
```

## Request Flow

1. User writes a note in the frontend capture form.
2. Frontend sends the note to `POST /api/v1/notes`.
3. Backend validates input and enriches the note with:
   - rule-based tags
   - extracted task items
4. Backend stores the note in MongoDB.
5. Frontend fetches notes, tasks, and search results for display.

## Architectural Decisions

- Clean separation between UI, API, and persistence
- Thin routes with business logic in services
- Pydantic schemas for request and response validation
- MongoDB for flexible note documents
- Rule-based intelligence isolated in reusable backend services

## Near-Term Implementation Order

1. Scaffold backend app and routing
2. Define MongoDB schemas and repository layer
3. Build note enrichment logic
4. Build frontend capture and timeline UI
5. Integrate frontend with REST API
6. Add tests for backend endpoints and logic
