import type { Pagination } from "@/types/pagination";
import type { CrawlerBookBook } from "@/utils/crawler/types/crawlerBook";

export interface BookListItem extends CrawlerBookBook {
  page: Pagination;
  index: number;
}
