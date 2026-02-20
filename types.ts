
export interface Notice {
  id: string;
  title: string;
  body: string;
  is_published: boolean;
  published_at: string;
}

export interface GalleryFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: any;
}

export interface DevotionalData {
  title: string;
  text: string;
  reference: string;
}
