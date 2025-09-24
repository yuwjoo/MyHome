export const routes = [
  {
    path: "/",
    component: () => import("@/layout/layout-main.vue"),
    redirect: { name: "albumDetail", params: { id: 1 } },
    children: [
      {
        path: "book-city",
        name: "book-city",
        component: () => import("@/views/book-city/book-city.vue"),
        meta: {
          title: "书城",
          keepAlive: true,
          main: true
        }
      },
      {
        path: "book-search",
        name: "book-search",
        component: () => import("@/views/book-search/book-search.vue"),
        meta: {
          title: "搜索",
          keepAlive: true,
          main: true
        }
      },
      {
        path: "book-detail",
        name: "book-detail",
        component: () => import("@/views/book-detail/book-detail.vue"),
        meta: {
          title: "详情",
          keepAlive: true
        }
      },
      {
        path: "book-read",
        name: "book-read",
        component: () => import("@/views/book-read/book-read.vue"),
        meta: {
          title: "阅读"
        }
      },
      {
        path: "test-page",
        name: "test-page",
        component: () => import("@/views/test-page/test-page.vue"),
        meta: {
          title: "测试页面"
        }
      },
      {
        path: "air-conditioner",
        name: "air-conditioner",
        component: () => import("@/views/air-conditioner/air-conditioner.vue"),
        meta: {
          title: "空调遥控器"
        }
      },
      {
        path: "albumList",
        name: "albumList",
        component: () => import("@/views/album/albumList/albumList.vue"),
        meta: {
          title: "相册",
          keepAlive: true
        }
      },
      {
        path: "albumDetail/:id",
        name: "albumDetail",
        component: () => import("@/views/album/albumDetail/albumDetail.vue"),
        meta: {
          title: "相册详情"
        }
      }
    ]
  }
];
