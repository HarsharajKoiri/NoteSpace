from fastapi.testclient import TestClient


def test_health_check_returns_ok(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_note_returns_created_note(client: TestClient) -> None:
    payload = {
        "title": "First note",
        "content": "Capture this thought for later.",
    }

    response = client.post("/api/v1/notes", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "First note"
    assert body["content"] == "Capture this thought for later."
    assert body["tags"] == []
    assert body["tasks"] == []
    assert body["id"]
    assert body["created_at"]
    assert body["updated_at"]


def test_create_note_applies_rule_based_tags_and_tasks(client: TestClient) -> None:
    payload = {
        "title": "Learning idea",
        "content": "Learn FastAPI patterns. Finish the backend service today. Buy milk.",
    }

    response = client.post("/api/v1/notes", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["tags"] == ["learning", "ideas", "tasks"]
    assert body["tasks"] == [
        {"text": "Finish the backend service today.", "completed": False},
        {"text": "Buy milk.", "completed": False},
    ]
    assert body["related_notes"] == []


def test_list_notes_includes_related_notes(client: TestClient) -> None:
    first_response = client.post(
        "/api/v1/notes",
        json={
            "title": "FastAPI learning",
            "content": "Learn FastAPI repository patterns and API design.",
        },
    )
    second_response = client.post(
        "/api/v1/notes",
        json={
            "title": "Backend design idea",
            "content": "Idea: build cleaner API design with repository services.",
        },
    )
    client.post(
        "/api/v1/notes",
        json={
            "title": "Groceries",
            "content": "Buy oats and fruit tonight.",
        },
    )

    response = client.get("/api/v1/notes")

    assert response.status_code == 200
    notes = response.json()
    first_note = next(note for note in notes if note["id"] == first_response.json()["id"])
    second_note = next(note for note in notes if note["id"] == second_response.json()["id"])

    assert len(first_note["related_notes"]) == 1
    assert first_note["related_notes"][0]["id"] == second_response.json()["id"]
    assert first_note["related_notes"][0]["shared_tags"] == []
    assert "design" in first_note["related_notes"][0]["shared_keywords"]
    assert "repository" in first_note["related_notes"][0]["shared_keywords"]

    assert len(second_note["related_notes"]) == 1
    assert second_note["related_notes"][0]["id"] == first_response.json()["id"]


def test_search_notes_matches_content_and_tags(client: TestClient) -> None:
    client.post(
        "/api/v1/notes",
        json={"title": "Architecture", "content": "Learn repository design patterns."},
    )
    client.post(
        "/api/v1/notes",
        json={"title": "Groceries", "content": "Buy oats and fruit."},
    )

    content_response = client.get("/api/v1/search", params={"q": "repository"})
    tag_response = client.get("/api/v1/search", params={"q": "tasks"})

    assert content_response.status_code == 200
    assert len(content_response.json()) == 1
    assert content_response.json()[0]["title"] == "Architecture"

    assert tag_response.status_code == 200
    assert len(tag_response.json()) == 1
    assert tag_response.json()[0]["title"] == "Groceries"


def test_search_notes_requires_non_empty_query(client: TestClient) -> None:
    response = client.get("/api/v1/search", params={"q": ""})

    assert response.status_code == 422


def test_list_tasks_aggregates_tasks_from_all_notes(client: TestClient) -> None:
    first_response = client.post(
        "/api/v1/notes",
        json={"title": "Errands", "content": "Buy tea. Complete taxes."},
    )
    second_response = client.post(
        "/api/v1/notes",
        json={"title": "Calls", "content": "Call the bank tomorrow."},
    )

    response = client.get("/api/v1/tasks")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 3
    assert body[0]["note_id"] == second_response.json()["id"]
    assert body[0]["note_title"] == "Calls"
    assert body[0]["text"] == "Call the bank tomorrow."
    assert body[0]["completed"] is False
    assert body[1]["note_id"] == first_response.json()["id"]
    assert body[1]["note_title"] == "Errands"
    assert body[1]["text"] == "Buy tea."
    assert body[2]["note_id"] == first_response.json()["id"]
    assert body[2]["note_title"] == "Errands"
    assert body[2]["text"] == "Complete taxes."


def test_list_notes_returns_newest_first(client: TestClient) -> None:
    client.post(
        "/api/v1/notes",
        json={"title": "Older note", "content": "This was created first."},
    )
    client.post(
        "/api/v1/notes",
        json={"title": "Newer note", "content": "This was created second."},
    )

    response = client.get("/api/v1/notes")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["title"] == "Newer note"
    assert body[1]["title"] == "Older note"


def test_get_note_returns_404_for_missing_note(client: TestClient) -> None:
    response = client.get("/api/v1/notes/missing-note-id")

    assert response.status_code == 404
    assert response.json()["detail"] == "Note 'missing-note-id' was not found."


def test_create_note_rejects_blank_content(client: TestClient) -> None:
    response = client.post(
        "/api/v1/notes",
        json={"title": "Blank", "content": "   "},
    )

    assert response.status_code == 422


def test_update_note_recomputes_tags_and_tasks(client: TestClient) -> None:
    create_response = client.post(
        "/api/v1/notes",
        json={"title": "Draft", "content": "Learn FastAPI patterns."},
    )

    response = client.put(
        f"/api/v1/notes/{create_response.json()['id']}",
        json={
            "title": "Errands",
            "content": "Buy milk. Call the bank tomorrow.",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Errands"
    assert body["tags"] == ["tasks"]
    assert body["tasks"] == [
        {"text": "Buy milk.", "completed": False},
        {"text": "Call the bank tomorrow.", "completed": False},
    ]
    assert body["created_at"] == create_response.json()["created_at"]
    assert body["updated_at"] != create_response.json()["updated_at"]


def test_update_note_returns_404_for_missing_note(client: TestClient) -> None:
    response = client.put(
        "/api/v1/notes/missing-note-id",
        json={"title": "Missing", "content": "Buy milk."},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Note 'missing-note-id' was not found."


def test_delete_note_removes_note_from_notes_and_tasks(client: TestClient) -> None:
    first_response = client.post(
        "/api/v1/notes",
        json={"title": "Keep", "content": "Learn FastAPI patterns."},
    )
    second_response = client.post(
        "/api/v1/notes",
        json={"title": "Delete", "content": "Buy milk."},
    )

    delete_response = client.delete(f"/api/v1/notes/{second_response.json()['id']}")
    notes_response = client.get("/api/v1/notes")
    tasks_response = client.get("/api/v1/tasks")

    assert delete_response.status_code == 204
    assert notes_response.status_code == 200
    assert [note["id"] for note in notes_response.json()] == [first_response.json()["id"]]
    assert tasks_response.status_code == 200
    assert tasks_response.json() == []


def test_delete_note_returns_404_for_missing_note(client: TestClient) -> None:
    response = client.delete("/api/v1/notes/missing-note-id")

    assert response.status_code == 404
    assert response.json()["detail"] == "Note 'missing-note-id' was not found."
