import { FontAwesome6 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Text } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { notesService } from "@/services/notesService";
import { colors } from "@/constants/theme";

export default function NoteEditor() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUris, setImageUris] = useState<string[]>([]);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                try {
                    const note = await notesService.getNote(id);
                    setTitle(note.title);
                    setContent(note.content);
                    setImageUris(note.imageUris);
                } catch (e) {
                    console.error('Failed to get note', e);
                }
            })();
        }, [id])
    );

    const handleSaveBtn = async () => {
        try {
            await notesService.updateNote(id, { title, content, imageUris });
        } catch (e) {
            console.error('Failed to update note', e);
        }
    };

    const handleAddImages = async () => {
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
            const destUri = await notesService.addImageToNote(id, result.assets[0].uri);
            const newImageUris = [...imageUris, destUri];
            setImageUris(newImageUris);
        } catch (e) {
            console.error('Failed to add image to note', e);
        }
    };

    const handleRemoveImage = (uri: string) => {
        Alert.alert(
            "Remove image?",
            "This will remove the image from this note.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        const filteredImageUris = imageUris.filter(u => u !== uri);
                        setImageUris(filteredImageUris);
                    }
                },
            ]
        );
    };

    return (
        <>
            <Stack.Screen options={{
                headerRight: () => (
                    <TouchableOpacity onPress={handleSaveBtn}>
                        <Text style={styles.saveButton}>Save</Text>
                    </TouchableOpacity>
                ),
            }} />
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior="padding"
                keyboardVerticalOffset={100}
            >
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Title"
                    style={styles.titleInput}
                    placeholderTextColor={colors.textSecondary}
                />
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesListContainer}>
                        {imageUris.map((uri) => (
                            <TouchableOpacity
                                key={uri}
                                onLongPress={() => handleRemoveImage(uri)} delayLongPress={300} accessibilityRole="button" accessibilityLabel="Remove image"
                            >
                                <Image source={{ uri }} style={styles.imageThumb} />
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={handleAddImages} style={styles.addThumb} accessibilityRole="button" accessibilityLabel="Add image">
                            <FontAwesome6 name="plus" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </ScrollView>
                </View>
                <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="Write your note..."
                    multiline
                    style={styles.textInput}
                    placeholderTextColor={colors.textSecondary}
                />
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    saveButton: {
        fontSize: 16,
    },
    keyboardAvoidingView: {
        flex: 1,
        backgroundColor: colors.background,
        gap: 12,
        padding: 12,
    },
    titleInput: {
        fontSize: 20,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    imagesListContainer: {
        gap: 8,
    },
    imageThumb: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    addThumb: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    textInput: {
        color: colors.textPrimary,
    },
});
