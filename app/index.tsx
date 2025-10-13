import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { textVectorStore } from "@/services/vectorStores/textVectorStore";
import Notes from "./notes";
import { imageEmbeddings, imageVectorStore } from "@/services/vectorStores/imageVectorStore";
import { CLIP_VIT_BASE_PATCH32_IMAGE } from "react-native-executorch";

export default function Index() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await textVectorStore.load();
        await imageVectorStore.load();
        await imageEmbeddings.load(CLIP_VIT_BASE_PATCH32_IMAGE, (progress) => {
          console.log("CLIP Image model loading progress:", progress);
        });
        setIsLoaded(true);
      } catch (e) {
        console.error('Vector stores failed to load', e);
      }
    })();
  }, [])

  return isLoaded ? <Notes /> : <ActivityIndicator />;
}
