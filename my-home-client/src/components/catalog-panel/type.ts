export interface Chapter {
  id: string;
  title: string;
}

export interface ChapterGroup {
  name: string;
  chapters: Chapter[];
}
