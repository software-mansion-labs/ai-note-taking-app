import { FontAwesome6 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView
} from "react-native";
import { notesService } from "@/services/notesService";
import type { Note } from "@/types/note";
import { colors } from "@/constants/theme";

const NoteList = ({ notes, label, onDeleteNote }: { notes: Note[], label: string, onDeleteNote: (noteId: string) => void }) => {
    const router = useRouter();

    return <View style={styles.listContainer}>
        <Text style={styles.listLabel}>{label} ({notes.length})</Text>
        {notes.map((item => (
            <TouchableOpacity
                key={item.id}
                onPress={() => router.push({ pathname: "/note/[id]", params: { id: item.id } })}
                onLongPress={() => onDeleteNote(item.id)}
                delayLongPress={300}
                style={styles.card}
            >
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.imageUris.length > 0 && (
                    <View style={styles.cardImageRow}>
                        {item.imageUris.map((uri) => (
                            <View key={uri} style={styles.cardImageThumbWrapper}>
                                <Image source={{ uri }} style={styles.cardImageThumb} />
                            </View>
                        ))}
                    </View>
                )}
                <Text numberOfLines={1} style={styles.cardContent}>{item.content}</Text>
                <View style={styles.cardFooter}>
                    <Text style={styles.cardTimestamp}>
                        {new Date(item.updatedAt).toLocaleString()}
                    </Text>
                    {item.similarity && (
                        <Text style={styles.cardSimilarity}>
                            {item.similarity.toFixed(2)}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        )))}
    </View>
}

export default function Notes() {
    const router = useRouter();

    const [notes, setNotes] = useState<Note[]>([]);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                try {
                    const storageNotes = await notesService.getNotes();
                    setNotes(storageNotes);
                } catch (e) {
                    console.error('Failed to list notes', e);
                }
            })();
        }, [])
    );

    const handleAddNote = async () => {
        try {
            const note = await notesService.createNote("", "", []);
            router.push({ pathname: "/note/[id]", params: { id: note.id } });
        } catch (e) {
            console.error('Failed to add note', e);
        }
    };

    const handleDeleteNote = (noteId: string) => {
        Alert.alert(
            "Delete note?",
            "This operation cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await notesService.deleteNote(noteId);
                        } catch (e) {
                            console.error('Failed to delete note', e);
                        }
                        setNotes(prev => prev ? prev.filter(n => n.id !== noteId) : prev);
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <NoteList notes={notes} label="All Notes" onDeleteNote={handleDeleteNote} />
            </ScrollView>
            <TouchableOpacity onPress={handleAddNote} style={styles.fab}>
                <FontAwesome6 name="plus" size={24} color={colors.fabIcon} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        padding: 12,
        backgroundColor: colors.background,
        gap: 12,
    },
    scrollView: {
        gap: 16,
    },
    listContainer: {
        gap: 4,
    },
    listLabel: {
        color: colors.textSecondary,
    },
    card: {
        borderRadius: 12,
        padding: 12,
        backgroundColor: colors.surface,
        gap: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    cardContent: {
        color: colors.textSecondary,
    },
    cardImageRow: {
        flexDirection: "row",
        gap: 4,
    },
    cardImageThumbWrapper: {
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: colors.surface,
    },
    cardImageThumb: {
        width: "100%",
        height: "100%",
    },
    cardTimestamp: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cardSimilarity: {
        fontSize: 12,
        fontWeight: "600",
    },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 40,
        backgroundColor: colors.fabBackground,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
    },
});
