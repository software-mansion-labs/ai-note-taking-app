import { FontAwesome6 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView
} from "react-native";
import { notesService } from "@/services/notesService";
import type { Note } from "@/types/note";
import { colors } from "@/constants/theme";

enum SearchMode {
    None,
    Text,
    Image,
}

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
    const [textSearchNotes, setTextSearchNotes] = useState<Note[]>([]);
    const [imageSearchNotes, setImageSearchNotes] = useState<Note[]>([]);

    const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.None);

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

    const handleSearch = async (query: string) => {
        const trimmedQuery = query.trim();
        if (trimmedQuery.length === 0) {
            setSearchMode(SearchMode.None);
            return;
        }

        if (trimmedQuery.length > 0) setSearchMode(SearchMode.Text);

        try {
            const textResults = await notesService.searchByText(trimmedQuery, notes);
            setTextSearchNotes(textResults);

            const imageResults = await notesService.searchImagesByText(trimmedQuery, notes);
            setImageSearchNotes(imageResults);
        } catch (e) {
            console.error('Failed to search by text', e);
        }
    };

    const handleImageSearch = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission required", "Photo library permission is needed to pick images.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            selectionLimit: 1,
            quality: 1,
        });
        if (result.canceled) return;

        try {
            const results = await notesService.searchByImageUri(result.assets[0].uri, notes || []);
            setImageSearchNotes(results);
        } catch (e) {
            console.error('Failed to search by image', e);
        }

        setSearchMode(SearchMode.Image);
    }

    const handleImageSearchDone = () => {
        setSearchMode(SearchMode.None);
    }

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

    const handleAIAssistant = () => {
        router.push("/ai-assistant");
    };

    const scrollViewContent = () => {
        switch (searchMode) {
            case SearchMode.Text:
                return <>
                    <NoteList notes={textSearchNotes} label="Text to Text Search Results (Top 3)" onDeleteNote={handleDeleteNote} />
                    <NoteList notes={imageSearchNotes} label="Text to Image Search Results (Top 3)" onDeleteNote={handleDeleteNote} />
                </>
            case SearchMode.None:
                return <NoteList notes={notes} label="All Notes" onDeleteNote={handleDeleteNote} />
            case SearchMode.Image:
                return <NoteList notes={imageSearchNotes} label="Image to Image Search Results (Top 3)" onDeleteNote={handleDeleteNote} />
            default:
                return null;
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchRow}>
                <TextInput
                    placeholder="Search notes"
                    onChangeText={handleSearch}
                    style={styles.searchInput}
                    placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                    onPress={searchMode === SearchMode.Image ? handleImageSearchDone : handleImageSearch}
                    style={styles.imageButton}
                >
                    <FontAwesome6 name={searchMode === SearchMode.Image ? "xmark" : "image"} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAIAssistant} style={styles.imageButton}>
                    <FontAwesome6 name="wand-magic-sparkles" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.scrollView}>
                {scrollViewContent()}
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
    searchRow: {
        flexDirection: "row",
        gap: 8,
    },
    searchInput: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        backgroundColor: colors.surface,
    },
    imageButton: {
        borderRadius: 12,
        padding: 10,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.surface,
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
