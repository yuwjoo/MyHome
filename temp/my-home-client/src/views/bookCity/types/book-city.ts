import type { Pagination } from "@/api/types";
import type { CrawlerBookBook } from "@/utils/crawler/types/crawlerBook";

export interface BookListItem extends CrawlerBookBook {
  page: Pagination;
  index: number;
}
