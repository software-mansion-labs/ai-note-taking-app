import { LLAMA3_2_1B_SPINQUANT, Message } from "react-native-executorch";
import { QueryResult, RAG } from "react-native-rag";
import { ExecuTorchLLM } from "@react-native-rag/executorch";
import { textVectorStore } from "@/services/vectorStores/textVectorStore";

export const rag = new RAG({
    vectorStore: textVectorStore,
    llm: new ExecuTorchLLM({
        ...LLAMA3_2_1B_SPINQUANT, onDownloadProgress: (progress) => {
            console.log("LLaMA model loading progress:", progress);
        }
    })
});

export const similarityScoreToDescription = (similarityScore: number) => {
    if (similarityScore > 0.6) return "Highly relevant";
    if (similarityScore > 0.4) return "Relevant";
    if (similarityScore > 0.2) return "Slightly relevant";
    return "Not relevant";
}

export const promptGenerator = (messages: Message[], retrieved: QueryResult[]) => {
    const relevantRetrieved = retrieved.filter(r => r.similarity > 0.2);
    const context = relevantRetrieved.map((r) => `${similarityScoreToDescription(r.similarity)}:\n\n${r.document}`).join("\n\n");
    const userQuestion = messages[messages.length - 1].content;

    return `You are an AI assistant helping a user with their notes. Use the following context to answer the user's question.

Context:
${context}

User's Question:
${userQuestion}

Answer:`
}