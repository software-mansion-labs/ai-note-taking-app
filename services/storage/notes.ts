import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Note } from "@/types/note";
import * as Crypto from "expo-crypto";

const STORAGE_KEY = "notes";

export async function getNotes(): Promise<Note[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return [];
    }
    const parsed: Note[] = JSON.parse(raw);
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getNoteById(noteId: string): Promise<Note> {
    const notes = await getNotes();
    const note = notes.find((n) => n.id === noteId);
    if (!note) {
        throw new Error("Note not found");
    }
    return note;
}

export async function createNote(data: { title: string; content: string; imageUris: string[] }): Promise<Note> {
    const note: Note = {
        id: Crypto.randomUUID(),
        title: data.title.trim(),
        content: data.content,
        imageUris: data.imageUris,
        updatedAt: Date.now(),
    };
    const notes = await getNotes();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([note, ...notes]));
    return note;
}

export async function updateNote(noteId: string, data: { title: string; content: string; imageUris: string[] }): Promise<void> {
    const notes = await getNotes();
    const note = notes.find((n) => n.id === noteId);
    if (!note) {
        throw new Error("Note not found");
    }
    const updatedNote: Note = {
        id: noteId,
        ...data,
        updatedAt: Date.now(),
    };
    const updatedNotes = notes.map((n) => n.id === noteId ? updatedNote : n);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
}

export async function deleteNote(noteId: string): Promise<void> {
    const notes = await getNotes();
    const leftNotes = notes.filter((n) => n.id !== noteId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(leftNotes));
}

export async function clearNotes(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
}
