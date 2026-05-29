import { request } from "@/utils/axios";
import * as cheerio from "cheerio";
import type {
  CrawlerBookAllGetChapterListParams,
  CrawlerBookBook,
  CrawlerBookChapter,
  CrawlerBookClassify,
  CrawlerBookGetBookContentParams,
  CrawlerBookGetBookContentResult,
  CrawlerBookGetChapterListParams,
  CrawlerBookGetChapterListResult,
  CrawlerBookGetDetailParams,
  CrawlerBookGetListParams,
  CrawlerBookGetListResult,
  CrawlerBookSearchParams,
  CrawlerBookSearchResult
} from "../../types/crawlerBook";

/**
 * @description: 模糊搜索小说
 * @param {CrawlerBookSearchParams} params 参数
 * @return {Promise<CrawlerBookSearchResult>} 结果
 */
export async function search(params: CrawlerBookSearchParams): Promise<CrawlerBookSearchResult> {
  const res = await request.get(`https://www3.lengku8.cc/search/${params.searchValue}/${params.current}`, {
    sendEnv: "android"
  });
  const $ = cheerio.load(res.data);

  const list = $(".SHsectionThree-middle p")
    .map((_i, el) => {
      const elSpan = $(el).children("span");

      const id = elSpan.eq(1).children("a").attr("href")?.match(/\d+/)?.[0] || "";
      const title = elSpan.eq(1).children("a").text();
      const classify = {
        id: elSpan.eq(0).children("a").attr("href")?.match(/\d+/)?.[0] || "",
        name: elSpan.eq(0).children("a").text()
      };
      const author = {
        id: elSpan.eq(2).children("a").attr("href")?.match(/\d+/)?.[0] || "",
        name: elSpan.eq(2).children("a").text()
      };

      return { id, title, classify, author };
    })
    .toArray();
  const current = Number($(".CGsectionTwo-right-bottom-detail span").eq(0).text() || 0);
  const size = list.length;
  const total = Number($(".CGsectionTwo-right-bottom-detail span").eq(1).text() || 0) * size;

  return { list, current, size, total };
}

/**
 * @description: 获取分类列表
 * @return {Promise<CrawlerBookClassify[]>} 结果
 */
export async function getClassifyList(): Promise<CrawlerBookClassify[]> {
  const res = await request.get(`https://www3.lengku8.cc/category/`, {
    sendEnv: "android"
  });
  const $ = cheerio.load(res.data);

  const list: CrawlerBookClassify[] = [];

  $(".CGsectionTwo-left a").each((_i, el) => {
    if (!$(el).text()) return;

    const id = $(el).attr("href")!.match(/\d+/)![0];
    const name = $(el).text();

    list.push({ id, name });
  });

  return list;
}

/**
 * @description: 获取小说列表
 * @param {CrawlerBookGetListParams} params 参数
 * @return {Promise<CrawlerBookGetListResult>} 结果
 */
export async function getList(params: CrawlerBookGetListParams): Promise<CrawlerBookGetListResult> {
  const res = await request.get(`https://www3.lengku8.cc/category/${params.classifyId}/${params.current}.html`, {
    sendEnv: "android"
  });
  const $ = cheerio.load(res.data);

  const elItems = $(".CGsectionTwo-right-content").children();

  let list: CrawlerBookBook[] = [];
  if (params.noImageMode) {
    const handler = (_i: number, el: any) => {
      const id =
        $(el)
          .find(".title")
          .attr("href")
          ?.match(/\/book\/(\d+)\//)?.[1] || ""; // id
      const title = $(el).find(".title").text(); // 标题
      const author = {
        id: $(el)
          .find("a.b")
          .attr("href")!
          .match(/\/writer\/(\d+)\//)![1], // 作者id
        name: $(el).find("a.b").text() // 作者名称
      };
      const classify = {
        id: "", // 分类id
        name: "" // 分类名称
      };
      const intro = $(el).children("p").eq(2).text(); // 描述
      const cover = ""; // 封面
      const updateDate =
        $(el)
          .children("p")
          .eq(3)
          .text()
          .match(/[\d-]+/)?.[0] || ""; // 更新时间
      const lastChapter = {
        id: "", // 章节id
        title: "", // 章节标题
        isLock: false
      };
      const state: -1 = -1; // 状态

      return { id, title, cover, intro, author, classify, updateDate, lastChapter, state };
    };
    list = elItems.map(handler).toArray();
  } else {
    const handler = (_i: number, el: any) => {
      const id =
        $(el)
          .find(".title")
          .attr("href")
          ?.match(/\/book\/(\d+)\//)?.[1] || ""; // id

      return getDetail({ id });
    };
    list = await Promise.all(elItems.map(handler).toArray());
  }

  const current = Number($(".CGsectionTwo-right-bottom-detail span").eq(0).text() || 0);
  const size = Number($(".CGsectionTwo-right-bottom-detail span").eq(2).text() || 0);
  const total = Number($(".CGsectionTwo-right-bottom-detail span").eq(1).text() || 0) * size;

  return { current, size, total, list };
}

/**
 * @description: 获取小说详情
 * @param {CrawlerBookGetDetailParams} params 参数
 * @return {Promise<CrawlerBookBook>} 结果
 */
export async function getDetail(params: CrawlerBookGetDetailParams): Promise<CrawlerBookBook> {
  const res = await request.get(`https://www3.lengku8.cc/book/${params.id}/`, {
    sendEnv: "android"
  });
  const $ = cheerio.load(res.data);

  const title = $(".BGsectionOne-top-right .title").eq(0).text(); // 标题
  const author = {
    id: $(".BGsectionOne-top-right .author .b")
      .eq(0)
      .attr("href")!
      .match(/\/writer\/(\d+)\//)![1], // 作者id
    name: $(".BGsectionOne-top-right .author .b").eq(0).text() // 作者名
  };
  const textArr = $(".BGsectionOne-top-right .category")
    .eq(0)
    .children("span")
    .map((_i, el) => $(el).text())
    .toArray();
  const classify = {
    id: $(".BGsectionOne-top-right .category").eq(0).find("span a").eq(0).attr("href")?.match(/\d+/)?.[0] || "", // 分类id
    name: textArr[0]
  };
  const state = ["连载", "完结"].indexOf(textArr[2]) as CrawlerBookBook["state"]; // 状态
  const updateDate = $(".BGsectionOne-top-right .time").eq(0).children("span").text(); // 更新时间
  const cover = $(".BGsectionOne-top-left .lazyload").attr("_src") || ""; // 封面
  const intro = $(".BGsectionTwo-bottom").text(); // 简介
  const lastChapter = {
    id:
      $(".BGsectionOne-top-right .newestChapter .r")
        .attr("href")
        ?.match(/(\d+)\.html/)?.[1] || "", // 最新章节id
    title: $(".BGsectionOne-top-right .newestChapter .r").text(), // 最新章节标题
    isLock: false
  };

  return { id: params.id, title, cover, intro, author, classify, updateDate, lastChapter, state };
}

/**
 * @description: 获取小说章节列表
 * @param {CrawlerBookGetChapterListParams} params 参数
 * @return {Promise<CrawlerBookGetChapterListResult>} 结果
 */
export async function getChapterList(
  params: CrawlerBookGetChapterListParams
): Promise<CrawlerBookGetChapterListResult> {
  const res = await request.get(`https://www3.lengku8.cc/book/${params.id}/catalog/${params.current}.html`, {
    sendEnv: "android"
  });
  const $ = cheerio.load(res.data);

  const originalOrderArrStr = res.data.match(/var originalOrder = \[(.+)\];/)?.[1]; // 章节排序映射规则数组字符串
  const list: CrawlerBookChapter[] = [];

  if (originalOrderArrStr) {
    const originalOrder = originalOrderArrStr.split(","); // 章节排序映射规则
    $(".BCsectionTwo-top .BCsectionTwo-top-chapter a").each((i, el) => {
      list[originalOrder[i]] = {
        id: $(el)
          .attr("href")!
          .match(/(\d+)\.html/)![1], // 章节id
        title: $(el).attr("data-real")!, // 章节标题
        isLock: false
      };
    });
  } else {
    $(".BCsectionTwo-top .BCsectionTwo-top-chapter").each((_i, el) => {
      const pos = $(el).attr("data-x") ?? $(el).attr("data-iddd")!;
      const a = $(el).children("a");
      const bookContentLink = a.attr("data-link") ?? a.attr("data-sb") ?? a.attr("data-wawa")!;
      const id = atob(bookContentLink).match(/(\d+)\.html/)![1]; // 章节id
      const title = a.attr("abc-title") ?? a.attr("uc-title") ?? a.attr("data-btbt") ?? a.text().trim(); // 章节标题

      list[pos] = { id, title };
    });
  }

  const current = params.current;
  const size = list.length;
  const total = Number($(".CGsectionTwo-right-bottom-detail span").eq(1).text() || 0) * size;

  return { list, current, size, total };
}

/**
 * @description: 获取完整小说章节列表
 * @param {CrawlerBookAllGetChapterListParams} params 参数
 * @return {Promise<CrawlerBookChapter[]>} 结果
 */
export async function getAllChapterList(params: CrawlerBookAllGetChapterListParams): Promise<CrawlerBookChapter[]> {
  const list: CrawlerBookChapter[] = [];
  let current = 0;
  let size = 0;
  let total = 0;
  do {
    const result = await getChapterList({ id: params.id, current: ++current });
    list.push(...result.list);
    size = result.size;
    total = result.total;
  } while (current * size <= total);

  return list;
}

/**
 * @description: 获取小说内容
 * @param {CrawlerBookGetBookContentParams} params 参数
 * @return {Promise<CrawlerBookGetBookContentResult>} 结果
 */
export async function getBookContent(
  params: CrawlerBookGetBookContentParams
): Promise<CrawlerBookGetBookContentResult> {
  const res = await request.get(`https://www3.lengku8.cc/book/${params.id}/${params.chapterId}.html`, {
    sendEnv: "android"
  });
  const $ = cheerio.load(res.data);

  const paragraphs: string[] = [];
  let isEnd = false;
  $(".RBGsectionThree-content p").each((_i, el) => {
    if ($(el).attr("style") === "color:orange;") isEnd = true;
    if (isEnd) return;
    paragraphs.push($(el).text()); // 小说段落
  });
  const title = $("#chapterTitle").text(); // 章节标题
  const prevChapterId = ($(".RBGsectionTwo-left .qian_page")
    .attr("href")!
    .match(/(\d+)\.html/) || [])![1]; // 上一章id
  const nextChapterId = ($(".RBGsectionTwo-right .hou_page")
    .eq(0)
    .attr("href")!
    .match(/(\d+)\.html/) || [])![1]; // 下一章id

  return { chapterId: params.chapterId, title, paragraphs, prevChapterId, nextChapterId };
}
