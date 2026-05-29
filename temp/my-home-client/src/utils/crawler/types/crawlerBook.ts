/**
 * 分页
 */
export interface CrawlerBookPage {
  current: number; // 当前页
  size: number; // 每页条数
  total: number; // 总条数
}

/**
 * 小说数据
 */
export interface CrawlerBookBook {
  id: string; // id
  title: string; // 标题
  cover: string; // 封面
  intro: string; // 简介
  author: CrawlerBookAuthor; // 作者
  classify: CrawlerBookClassify; // 分类
  updateDate: string; // 更新日期
  lastChapter: CrawlerBookChapter; // 最新章节
  state: -1 | 0 | 1; // 状态："未知" | "连载" | "完结"
}

/**
 * 小说作者
 */
export interface CrawlerBookAuthor {
  id: string; // 作者id
  name: string; // 作者名称
}

/**
 * 小说章节
 */
export interface CrawlerBookChapter {
  id: string; // 章节id
  title: string; // 章节标题
  isLock: boolean; // 是否锁定
}

/**
 * 小说分类
 */
export interface CrawlerBookClassify {
  id: string; // 分类id
  name: string; // 分类名称
}

/**
 * meta
 */
export interface CrawlerBookMeta<T = string> {
  name: T; // 名称
  title: string; // 标题
  link: string; // 链接
}

/**
 * 模糊查询参数
 */
export interface CrawlerBookSearchParams {
  searchValue: string; // 模糊查询值
  current: CrawlerBookPage["current"]; // 当前页
}

/**
 * 模糊查询结果
 */
export interface CrawlerBookSearchResult extends CrawlerBookPage {
  list: Pick<CrawlerBookBook, "id" | "classify" | "author" | "title">[]; // 小说列表
}

/**
 * 获取小说列表参数
 */
export interface CrawlerBookGetListParams {
  current: CrawlerBookPage["current"]; // 当前页
  classifyId: CrawlerBookClassify["id"]; // 分类id
  noImageMode?: boolean; // 是否无图模式
}

/**
 * 获取小说列表结果
 */
export interface CrawlerBookGetListResult extends CrawlerBookPage {
  list: CrawlerBookBook[]; // 小说列表
}

/**
 * 获取小说详情参数
 */
export interface CrawlerBookGetDetailParams {
  id: CrawlerBookBook["id"]; // id
}

/**
 * 获取小说章节列表参数
 */
export interface CrawlerBookGetChapterListParams {
  id: CrawlerBookBook["id"]; // id
  current: CrawlerBookPage["current"]; // 当前页
}

/**
 * 获取小说章节列表结果
 */
export interface CrawlerBookGetChapterListResult extends CrawlerBookPage {
  list: CrawlerBookChapter[]; // 章节列表
}

/**
 * 获取完整小说章节列表参数
 */
export interface CrawlerBookAllGetChapterListParams {
  id: CrawlerBookBook["id"]; // id
}

/**
 * 获取小说内容参数
 */
export interface CrawlerBookGetBookContentParams {
  id: CrawlerBookBook["id"]; // id
  chapterId: CrawlerBookChapter["id"]; // 章节id
}

/**
 * 获取小说内容结果
 */
export interface CrawlerBookGetBookContentResult {
  chapterId: CrawlerBookChapter["id"]; // 章节id
  title: CrawlerBookChapter["title"]; // 标题
  paragraphs: string[]; // 段落集合
  prevChapterId: CrawlerBookChapter["id"]; // 上一章id
  nextChapterId: CrawlerBookChapter["id"]; // 下一章id
}
