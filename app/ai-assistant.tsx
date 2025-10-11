import { Feather, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { colors } from "@/constants/theme";
import { LLAMA3_2_1B_SPINQUANT, Message, SpeechToTextModule, WHISPER_TINY_EN } from "react-native-executorch";
import { QueryResult, RAG } from "react-native-rag";
import { ExecuTorchLLM } from "@react-native-rag/executorch";
import { textVectorStore } from "@/services/vectorStores/textVectorStore";
import { AudioManager, AudioRecorder } from "react-native-audio-api";


const speechToTextModule = new SpeechToTextModule();

// React Native Audio API setup
const recorder = new AudioRecorder({
    sampleRate: 16000,
    bufferLengthInSamples: 1600,
});
AudioManager.setAudioSessionOptions({
    iosCategory: 'playAndRecord',
    iosMode: 'spokenAudio',
    iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
});
AudioManager.requestRecordingPermissions();
recorder.onAudioReady(({ buffer }) => {
    speechToTextModule.streamInsert(buffer.getChannelData(0));
});

const rag = new RAG({
    vectorStore: textVectorStore,
    llm: new ExecuTorchLLM({
        ...LLAMA3_2_1B_SPINQUANT, onDownloadProgress: (progress) => {
            console.log("LLaMA model loading progress:", progress);
        }
    })
});

const similarityScoreToDescription = (similarityScore: number) => {
    if (similarityScore > 0.6) return "Highly relevant";
    if (similarityScore > 0.4) return "Relevant";
    if (similarityScore > 0.2) return "Slightly relevant";
    return "Not relevant";
}

const promptGenerator = (messages: Message[], retrieved: QueryResult[]) => {
    const relevantRetrieved = retrieved.filter(r => r.similarity > 0.2);
    const context = relevantRetrieved.map((r) => `Note title: ${r.metadata?.title} - ${similarityScoreToDescription(r.similarity)}:\n\n${r.document}`).join("\n\n");
    const userQuestion = messages[messages.length - 1].content;

    return `You are an AI assistant helping a user with their notes. Use the following context to answer the user's question.

Context:
${context}

User's Question:
${userQuestion}

Answer:`
}

export default function AIAssistant() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");

    const [ragIsReady, setRagIsReady] = useState(false);
    const [ragIsGenerating, setRagIsGenerating] = useState(false);
    const [ragResponse, setRagResponse] = useState("");

    const [isTranscribing, setIsTranscribing] = useState(false);

    useEffect(() => {
        if (ragIsReady) return;

        (async () => {
            try {
                await speechToTextModule.load(WHISPER_TINY_EN, (progress) => {
                    console.log("Whisper model loading progress:", progress);
                });
                await rag.load();
                setRagIsReady(true);
            } catch (e) {
                console.error('Failed to load AI assistant components', e);
            }
        })();

        return () => {
            rag.interrupt();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleStartGenerating = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed || !ragIsReady || ragIsGenerating) return;

        const newMessage: Message = { role: "user", content: trimmed };
        const newMessages = [...messages, newMessage];

        setInputValue("");
        setMessages(newMessages);
        setRagIsGenerating(true);
        try {
            const response = await rag.generate({
                input: newMessages,
                nResults: 1,
                callback: (token) => { setRagResponse((prev) => prev + token) },
                promptGenerator,
            });
            setRagIsGenerating(false);
            setRagResponse("");
            setMessages([...newMessages, { role: "assistant", content: response }]);
        } catch (e) {
            console.error('Failed to generate response', e);
        }
    };

    const handleStopGenerating = () => {
        if (!ragIsGenerating) return;
        rag.interrupt();
        setRagIsGenerating(false);
        setRagResponse("");
    };

    const handleStartTranscribing = async () => {
        if (!ragIsReady || ragIsGenerating || isTranscribing) return;
        setIsTranscribing(true);
        setInputValue("");

        try {
            recorder.start();

            let committedTranscription = "";
            for await (const { committed, nonCommitted } of speechToTextModule.stream()) {
                committedTranscription += committed;
                setInputValue(committedTranscription + nonCommitted);
            }
        } catch (e) {
            console.error('Transcription failed', e);
        }

        setIsTranscribing(false);
    };

    const handleStopTranscribing = () => {
        if (!isTranscribing) return;
        recorder.stop();
        speechToTextModule.streamStop();
        setIsTranscribing(false);
    };

    if (!ragIsReady) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading AI Assistant</Text>
            </SafeAreaView>
        );
    }

    const extendedMessages = ragIsGenerating
        ? [...messages, { role: "assistant", content: ragResponse }]
        : messages;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior="padding"
                keyboardVerticalOffset={140}
            >
                <ScrollView contentContainerStyle={styles.scrollView}>
                    {extendedMessages.map((msg, index) => (
                        <View key={index} style={[styles.messageBubble, msg.role === "user" ? styles.messageBubbleUser : styles.messageBubbleAssistant]}>
                            <Text style={styles.messageText}>{msg.content}</Text>
                        </View>
                    ))}
                </ScrollView>
                <View style={styles.inputBar}>
                    <TextInput
                        value={inputValue}
                        onChangeText={setInputValue}
                        multiline
                        placeholder="Ask me anything..."
                        placeholderTextColor={colors.textSecondary}
                        style={styles.textInput}
                    />
                    <View style={styles.sendButtonWrapper}>
                        {isTranscribing ? (
                            <TouchableOpacity onPress={handleStopTranscribing} style={styles.sendButton} disabled={ragIsGenerating}>
                                <FontAwesome6 name="circle-stop" size={24} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={handleStartTranscribing} style={styles.sendButton} disabled={ragIsGenerating}>
                                <MaterialIcons name="multitrack-audio" size={24} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.sendButtonWrapper}>
                        {ragIsGenerating ? (
                            <TouchableOpacity onPress={handleStopGenerating} style={styles.sendButton} disabled={ragIsGenerating}>
                                <FontAwesome6 name="circle-stop" size={24} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={handleStartGenerating} style={styles.sendButton} disabled={ragIsGenerating}>
                                <Feather name="arrow-up-circle" size={24} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    container: {
        flex: 1,
        padding: 12,
        backgroundColor: colors.background,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    inputBar: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 4,
    },
    textInput: {
        flex: 1,
        padding: 8,
        alignSelf: 'center',
    },
    sendButtonWrapper: {
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    sendButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
        gap: 8,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 12,
    },
    messageBubbleAssistant: {
        padding: 0,
    },
    messageBubbleUser: {
        maxWidth: '80%',
        backgroundColor: colors.surface,
        alignSelf: 'flex-end',
    },
    messageText: {
        fontSize: 16,
    },
});
