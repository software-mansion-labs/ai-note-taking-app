import { ExecuTorchEmbeddings } from '@react-native-rag/executorch';
import { OPSQLiteVectorStore } from '@react-native-rag/op-sqlite';
import { CLIP_VIT_BASE_PATCH32_TEXT, ImageEmbeddingsModule } from "react-native-executorch";

const imageEmbeddings = new ImageEmbeddingsModule();
export { imageEmbeddings };

export const imageVectorStore = new OPSQLiteVectorStore({
    name: "notes_image_vector_store",
    embeddings: new ExecuTorchEmbeddings({
        ...CLIP_VIT_BASE_PATCH32_TEXT, onDownloadProgress: (progress) => {
            console.log("CLIP Text model loading progress:", progress);
        }
    }),
});