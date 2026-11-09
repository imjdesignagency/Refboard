export interface Asset {
  id: string;
  projectId?: string;
  type: 'image' | 'model' | 'thumbnail';
  name: string;
  storageKey: string;
  mimeType?: string;
  fileSize?: number;
  dataBlob?: Blob;
  source?: string;
  licence?: string;
  createdAt: number;
}
