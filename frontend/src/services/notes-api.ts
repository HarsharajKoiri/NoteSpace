import type { AggregatedTask, Note, NoteFormValues, RelatedNote, TaskItem } from "@/types/note";

type ApiTaskItem = TaskItem;

type ApiNote = {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  tasks: ApiTaskItem[];
  related_notes: ApiRelatedNote[];
  created_at: string;
  updated_at: string;
};

type ApiRelatedNote = {
  id: string;
  title: string | null;
  tags: string[];
  shared_tags: string[];
  shared_keywords: string[];
};

type ApiAggregatedTask = {
  note_id: string;
  note_title: string | null;
  text: string;
  completed: boolean;
  created_at: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function mapApiNote(note: ApiNote): Note {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    tags: note.tags,
    tasks: note.tasks,
    relatedNotes: note.related_notes.map(mapApiRelatedNote),
    createdAt: note.created_at,
  };
}

function mapApiRelatedNote(note: ApiRelatedNote): RelatedNote {
  return {
    id: note.id,
    title: note.title,
    tags: note.tags,
    sharedTags: note.shared_tags,
    sharedKeywords: note.shared_keywords,
  };
}

function mapApiTask(task: ApiAggregatedTask): AggregatedTask {
  return {
    noteId: task.note_id,
    noteTitle: task.note_title,
    text: task.text,
    completed: task.completed,
    createdAt: task.created_at,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong while talking to the API.";

    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      message = "The API returned an invalid response.";
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function fetchNotes(): Promise<Note[]> {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const notes = await handleResponse<ApiNote[]>(response);
  return notes.map(mapApiNote);
}

export async function createNote(values: NoteFormValues): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: values.title || null,
      content: values.content,
    }),
  });
  const note = await handleResponse<ApiNote>(response);
  return mapApiNote(note);
}

export async function searchNotes(query: string): Promise<Note[]> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const notes = await handleResponse<ApiNote[]>(response);
  return notes.map(mapApiNote);
}

export async function fetchTasks(): Promise<AggregatedTask[]> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const tasks = await handleResponse<ApiAggregatedTask[]>(response);
  return tasks.map(mapApiTask);
}
