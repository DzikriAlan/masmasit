export interface PayloadPostUploads {
  bucket: string;
  path: string;
  file: File;
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
