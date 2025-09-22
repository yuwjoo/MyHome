import { useBook } from "@/store/book";
import { crawlers } from "@/utils/crawler";
import type {
  ApiSearchBookParams,
  ApiSearchBookResult,
  ApiGetBookClassifyListResult,
  ApiGetBookListParams,
  ApiGetBookListResult,
  ApiGetBookDetailParams,
  ApiGetBookDetailResult,
  ApiGetBookAllChapterListParams,
  ApiGetBookAllChapterListResult,
  ApiGetBookContentParams,
  ApiGetBookContentResult
} from "./types/book";

const bookStore = useBook();

const currentBookCrawler = computed(() => {
  switch (bookStore.bookPlatform.current) {
    case crawlers.lengku8.meta.name:
      return crawlers.lengku8;
    case crawlers.tbxsw.meta.name:
      return crawlers.tbxsw;
    default:
      return crawlers.lengku8;
  }
});

/**
 * @description: 模糊查询
 * @param {ApiSearchBookParams} params 参数
 * @return {Promise<ApiSearchBookResult>} 结果
 */
export function searchBook(params: ApiSearchBookParams): Promise<ApiSearchBookResult> {
  return currentBookCrawler.value.search(params);
}

/**
 * @description: 获取小说分类列表
 * @return {Promise<ApiGetBookClassifyListResult>} 结果
 */
export function getBookClassifyList(): Promise<ApiGetBookClassifyListResult> {
  return currentBookCrawler.value.getClassifyList();
}

/**
 * @description: 获取小说列表
 * @param {ApiGetBookListParams} params 参数
 * @return {Promise<ApiGetBookListResult>} 结果
 */
export function getBookList(params: ApiGetBookListParams): Promise<ApiGetBookListResult> {
  return currentBookCrawler.value.getList(params);
}

/**
 * @description: 获取小说详情
 * @param {ApiGetBookDetailParams} params 参数
 * @return {Promise<ApiGetBookDetailResult>} 结果
 */
export function getBookDetail(params: ApiGetBookDetailParams): Promise<ApiGetBookDetailResult> {
  return currentBookCrawler.value.getDetail(params);
}

/**
 * @description: 获取小说所有章节列表
 * @param {ApiGetBookAllChapterListParams} params 参数
 * @return {Promise<ApiGetBookAllChapterListResult>} 结果
 */
export function getBookAllChapterList(params: ApiGetBookAllChapterListParams): Promise<ApiGetBookAllChapterListResult> {
  return currentBookCrawler.value.getAllChapterList(params);
}

/**
 * @description: 获取小说内容
 * @param {ApiGetBookContentParams} params 参数
 * @return {Promise<ApiGetBookContentResult>} 结果
 */
export function getBookContent(params: ApiGetBookContentParams): Promise<ApiGetBookContentResult> {
  return currentBookCrawler.value.getBookContent(params);
}
