export const routes = [
  // 认证相关路由
  {
    path: "/auth",
    component: () => import("@/views/auth/components/AuthLayout.vue"),
    children: [
      {
        path: "login",
        name: "login",
        component: () => import("@/views/auth/LoginView.vue"),
        meta: {
          title: "登录",
          requiresAuth: false
        }
      },
      {
        path: "register",
        name: "register",
        component: () => import("@/views/auth/RegisterView.vue"),
        meta: {
          title: "注册",
          requiresAuth: false
        }
      }
    ]
  },

  // 主布局路由
  {
    path: "/",
    component: () => import("@/layout/layout-main.vue"),
    redirect: "/home",
    meta: {
      requiresAuth: false
    },
    children: [
      {
        path: "home",
        name: "home",
        component: () => import("@/views/home/HomeView.vue"),
        meta: {
          title: "首页",
          keepAlive: true,
          main: true
        }
      },
      {
        path: "book-city",
        name: "book-city",
        component: () => import("@/views/bookCity/BookCityView.vue"),
        meta: {
          title: "书城",
          keepAlive: true,
          main: true
        }
      },
      {
        path: "book-search",
        name: "book-search",
        component: () => import("@/views/bookSearch/BookSearchView.vue"),
        meta: {
          title: "搜索",
          keepAlive: true,
          main: true
        }
      },
      {
        path: "book-detail",
        name: "book-detail",
        component: () => import("@/views/bookDetail/BookDetailView.vue"),
        meta: {
          title: "详情",
          keepAlive: true
        }
      },
      {
        path: "book-read",
        name: "book-read",
        component: () => import("@/views/bookRead/BookReadView.vue"),
        meta: {
          title: "阅读"
        }
      },
      {
        path: "test-page",
        name: "test-page",
        component: () => import("@/views/testPage/TestPageView.vue"),
        meta: {
          title: "测试页面"
        }
      },
      {
        path: "air-conditioner",
        name: "air-conditioner",
        component: () => import("@/views/airConditioner/AirConditionerView.vue"),
        meta: {
          title: "空调遥控器",
          main: true
        }
      },
      {
        path: "moments",
        name: "moments",
        component: () => import("@/views/moments/MomentsView.vue"),
        meta: {
          title: "动态",
          main: true
        }
      },
      {
        path: "publish-moment",
        name: "publish-moment",
        component: () => import("@/views/moments/PublishMomentView.vue"),
        meta: {
          title: "发表动态"
        }
      },
      {
        path: "moments/search",
        name: "moments-search",
        component: () => import("@/views/moments/SearchMomentsView.vue"),
        meta: {
          title: "搜索动态"
        }
      },
      {
        path: "cloudDisk",
        name: "cloudDisk",
        component: () => import("@/views/cloudDisk/CloudDiskView.vue"),
        meta: {
          title: "云盘",
          main: true
        }
      },
      {
        path: "cloudDiskFileDetails",
        name: "cloudDiskFileDetails",
        component: () => import("@/views/cloudDisk/children/cloudDiskFileDetails/CloudDiskFileDetailsView.vue"),
        meta: {
          title: "云盘文件详情"
        }
      },
      {
        path: "cloud-drive",
        name: "cloud-drive",
        component: () => import("@/views/cloudDrive/CloudDriveView.vue"),
        meta: {
          title: "云盘",
          main: true
        }
      },
      {
        path: "cloud-drive/file/:id",
        name: "file-detail",
        component: () => import("@/views/cloudDrive/FileDetailView.vue"),
        meta: {
          title: "文件详情"
        }
      },
      {
        path: "cloud-drive/search",
        name: "cloud-drive-search",
        component: () => import("@/views/cloudDrive/CloudDriveSearchView.vue"),
        meta: {
          title: "文件搜索"
        }
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("@/views/profile/ProfileView.vue"),
        meta: {
          title: "我的",
          main: true
        }
      },
      {
        path: "albumList",
        name: "albumList",
        component: () => import("@/views/album/albumList/AlbumListView.vue"),
        meta: {
          title: "相册",
          keepAlive: true
        }
      },
      {
        path: "albumDetail/:id",
        name: "albumDetail",
        component: () => import("@/views/album/albumDetail/AlbumDetailView.vue"),
        meta: {
          title: "相册详情"
        }
      },
      {
        path: "carRemoteControl",
        name: "carRemoteControl",
        component: () => import("@/views/carRemoteControl/CarRemoteControlView.vue"),
        meta: {
          title: "小车控制"
        }
      },
      {
        path: "airControl",
        name: "airControl",
        component: () => import("@/views/airControl/AirControlView.vue"),
        meta: {
          title: "卧室空调"
        }
      },
      {
        path: "my",
        name: "my",
        component: () => import("@/views/my/MyView.vue"),
        meta: {
          title: "我的"
        }
      }
    ]
  },

  // 404路由
  {
    path: "/:pathMatch(.*)*",
    redirect: "/404"
  }
];
