export interface DataArticles {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  created_at: string;
}

export interface Articles {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataArticles[] | null;
}

export interface ArticlesDetail {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataArticles | null;
}
