export interface PayloadPostUploads {
  bucket: string;
  path: string;
  file: Blob;
  contentType: string;
}

export interface DataUploads {
  publicUrl: string;
}

export interface Uploads {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataUploads | null;
}
