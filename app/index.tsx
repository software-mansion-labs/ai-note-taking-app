import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { textVectorStore } from "@/services/vectorStores/textVectorStore";
import Notes from "./notes";

export default function Index() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await textVectorStore.load();
        setIsLoaded(true);
      } catch (e) {
        console.error('Vector stores failed to load', e);
      }
    })();
  }, [])

  return isLoaded ? <Notes /> : <ActivityIndicator />;
}
