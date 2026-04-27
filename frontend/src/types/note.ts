export type TaskItem = {
  text: string;
  completed: boolean;
};

export type NoteFormValues = {
  title: string;
  content: string;
};

export type Note = {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  tasks: TaskItem[];
  relatedNotes: RelatedNote[];
  createdAt: string;
};

export type RelatedNote = {
  id: string;
  title: string | null;
  tags: string[];
  sharedTags: string[];
  sharedKeywords: string[];
};

export type AggregatedTask = {
  noteId: string;
  noteTitle: string | null;
  text: string;
  completed: boolean;
  createdAt: string;
};
