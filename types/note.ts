export type Note = {
    id: string;
    title: string;
    content: string;
    imageUris: string[];
    updatedAt: number;
    similarity?: number;
};
