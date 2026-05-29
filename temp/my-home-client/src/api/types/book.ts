import type {
  CrawlerBookAllGetChapterListParams,
  CrawlerBookBook,
  CrawlerBookChapter,
  CrawlerBookClassify,
  CrawlerBookGetBookContentParams,
  CrawlerBookGetBookContentResult,
  CrawlerBookGetDetailParams,
  CrawlerBookGetListParams,
  CrawlerBookGetListResult,
  CrawlerBookSearchParams,
  CrawlerBookSearchResult
} from "@/utils/crawler/types/crawlerBook";

/**
 * 模糊查询参数
 */
export type ApiSearchBookParams = CrawlerBookSearchParams;

/**
 * 模糊查询结果
 */
export type ApiSearchBookResult = CrawlerBookSearchResult;

/**
 * 获取小说分类列表参数
 */
export type ApiGetBookClassifyListResult = CrawlerBookClassify[];

/**
 * 获取小说列表参数
 */
export type ApiGetBookListParams = CrawlerBookGetListParams;

/**
 * 获取小说列表结果
 */
export type ApiGetBookListResult = CrawlerBookGetListResult;

/**
 * 获取小说详情参数
 */
export type ApiGetBookDetailParams = CrawlerBookGetDetailParams;

/**
 * 获取小说详情结果
 */
export type ApiGetBookDetailResult = CrawlerBookBook;

/**
 * 获取小说所有章节列表参数
 */
export type ApiGetBookAllChapterListParams = CrawlerBookAllGetChapterListParams;

/**
 * 获取小说所有章节列表结果
 */
export type ApiGetBookAllChapterListResult = CrawlerBookChapter[];

/**
 * 获取小说内容参数
 */
export type ApiGetBookContentParams = CrawlerBookGetBookContentParams;

/**
 * 获取小说内容结果
 */
export type ApiGetBookContentResult = CrawlerBookGetBookContentResult;
