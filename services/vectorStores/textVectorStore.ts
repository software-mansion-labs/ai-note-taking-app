import { RecursiveCharacterTextSplitter } from 'react-native-rag';
import { OPSQLiteVectorStore } from '@react-native-rag/op-sqlite';
import { ExecuTorchEmbeddings } from '@react-native-rag/executorch';
import { ALL_MINILM_L6_V2 } from "react-native-executorch";

export const textVectorStore = new OPSQLiteVectorStore({
    name: "notes_vector_store",
    embeddings: new ExecuTorchEmbeddings({
        ...ALL_MINILM_L6_V2, onDownloadProgress: (progress) => {
            console.log("all-MiniLM-L6-v2 model loading progress:", progress);
        }
    }),
});

export const noteToString = (note: { title: string; content: string }) => {
    return `${note.title}\n\n${note.content}`;
}

export const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
});
