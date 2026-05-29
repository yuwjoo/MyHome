export interface paths {
  "/api/system/auth/register": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 注册新用户 */
    post: operations["AuthController_register"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/system/auth/updateUserInfo": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 修改用户信息 */
    post: operations["AuthController_updateUserInfo"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/system/auth/changePassword": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 修改密码 */
    post: operations["AuthController_changePassword"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/system/auth/login": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 用户登录 */
    post: operations["AuthController_login"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/oss/uploadCallback": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** oss上传回调 */
    post: operations["OssController_uploadCallback"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/oss/uploadFile": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 上传文件 */
    post: operations["OssController_uploadFile"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/oss/getPublicFileThumbnail": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 获取公共文件缩略图 */
    get: operations["OssController_getPublicFileThumbnail"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/oss/getPublicFileDownloadUrl": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 获取公共文件下载url */
    get: operations["OssController_getPublicFileDownloadUrl"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/weather/getCityWeatherList": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 获取城市天气列表 */
    get: operations["WeatherController_getCityWeatherList"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/weather/getWeather": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 获取天气 */
    get: operations["WeatherController_getWeather"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/express/getExpressInfo": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 获取快递信息 */
    get: operations["ExpressController_getExpressInfo"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/express/queryCompanyByOrderNumber": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 根据快递单号查询快递公司 */
    get: operations["ExpressController_queryCompanyByOrderNumber"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/cloudDisk/create": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 创建文件/目录 */
    post: operations["CloudDiskController_create"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/cloudDisk/delete": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 删除文件/目录 */
    post: operations["CloudDiskController_delete"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/cloudDisk/move": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 移动文件/目录 */
    post: operations["CloudDiskController_move"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/cloudDisk/rename": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 重命名文件/目录 */
    post: operations["CloudDiskController_rename"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/cloudDisk/getInfo": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 获取单个文件/目录信息 */
    get: operations["CloudDiskController_getInfo"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/cloudDisk/getList": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 获取文件列表 */
    get: operations["CloudDiskController_getList"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/cloudDisk/getFileThumbnail": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 获取文件缩略图 */
    get: operations["CloudDiskController_getFileThumbnail"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/cloudDisk/getFileDownloadUrl": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 获取文件下载url */
    get: operations["CloudDiskController_getFileDownloadUrl"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/cloudDisk/getRecycleBinList": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 获取回收站文件列表 */
    get: operations["CloudDiskController_getRecycleBinList"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/cloudDisk/clearRecycleBin": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 清空回收站 */
    post: operations["CloudDiskController_clearRecycleBin"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/moments/savePost": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 保存说说 */
    post: operations["MomentsController_savePost"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/moments/deletePost": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 删除说说 */
    post: operations["MomentsController_deletePost"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/moments/getPostList": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** 获取说说列表 */
    get: operations["MomentsController_getPostList"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/moments/likePost": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 点赞/取消点赞说说 */
    post: operations["MomentsController_likePost"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/moments/commentPost": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 评论说说 */
    post: operations["MomentsController_commentPost"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/moments/deletePostComment": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** 删除评论 */
    post: operations["MomentsController_deletePostComment"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    "system-auth-RegisterDto": {
      /** @description 用户账号 */
      userAccount: string;
      /** @description 密码 */
      password: string;
      /** @description 用户名 */
      userName: string;
      /** @description 头像url */
      avatarUrl?: string;
    };
    "system-auth-LoginDto": {
      /** @description 账号 */
      userAccount: string;
      /** @description 密码 */
      password: string;
    };
    "system-auth-LoginUserDto": {
      userAccount: string;
      userName: string;
      avatarUrl?: string;
    };
    "system-auth-LoginResDto": {
      /** @description token凭证 */
      token: string;
      /** @description 用户信息 */
      user: components["schemas"]["system-auth-LoginUserDto"];
    };
    "system-auth-UpdateUserInfoDto": {
      /** @description 用户名 */
      userName?: string;
      /** @description 头像url */
      avatarUrl?: string;
    };
    "system-auth-ChangePasswordDto": {
      /** @description 旧密码 */
      oldPassword: string;
      /** @description 新密码 */
      newPassword: string;
    };
    "oss-UploadCallbackDto": {
      /** @description 文件哈希值 */
      hash: string;
      /** @description 存储空间名称 */
      bucket: string;
      /** @description 对象（文件）的完整路径 */
      object: string;
      /** @description 文件大小（字节） */
      size: number;
      /** @description 文件类型 */
      mimeType: string;
      /** @description 文件ETag */
      etag: string;
      /** @description 图片信息 */
      imageInfo?: string;
    };
    "oss-UploadFileDto": {
      /** @description 文件名称 */
      fileName: string;
      /** @description 文件哈希值 */
      fileHash: string;
      /** @description 文件大小 */
      fileSize: number;
      /** @description 文件类型 */
      fileMime: string;
    };
    "oss-UploadFileResDto-SignData": {
      /** @description 签名url */
      signUrl?: string;
      /** @description 签名请求头 */
      signHeaders?: Record<string, never>;
    };
    "oss-UploadFileResDto": {
      /** @description 是否已上传 */
      isUploaded: boolean;
      /** @description 签名数据 */
      signData?: components["schemas"]["oss-UploadFileResDto-SignData"];
      /** @description oss object引用id */
      ossObjectRefId?: string;
    };
    "weather-GetCityWeatherListResDto-City": {
      /** @description 站点id */
      stationid: string;
      /** @description 地区 */
      region: string;
      /** @description 国家 */
      country: string;
      /** @description 纬度 */
      latitude: number;
      /** @description 经度 */
      longitude: number;
      /** @description 最高温度 */
      high: number;
      /** @description 白天天气描述 */
      dayText: string;
      /** @description 白天天气代码 */
      dayCode: number;
      /** @description 白天风向 */
      dayWindDirection: string;
      /** @description 白天风力 */
      dayWindScale: string;
      /** @description 最低温度 */
      low: number;
      /** @description 夜晚天气描述 */
      nightText: string;
      /** @description 夜晚天气代码 */
      nightCode: number;
      /** @description 夜晚风向 */
      nightWindDirection: string;
      /** @description 夜晚风力 */
      nightWindScale: string;
      /** @description 行政区划代码 */
      areaNumber: string;
    };
    "weather-GetCityWeatherListResDto": {
      /** @description 城市列表 */
      cityList: components["schemas"]["weather-GetCityWeatherListResDto-City"][];
      /** @description 天气时间 */
      date: string;
      /** @description 最后更新时间 */
      lastUpdate: string;
    };
    "weather-GetWeatherResDto-Location": {
      /** @description 站点id */
      id: string;
      /** @description 地区名称 */
      name: string;
      /** @description 地区位置路径 */
      path: string;
      /** @description 经度 */
      longitude: number;
      /** @description 纬度 */
      latitude: number;
      /** @description 时区 */
      timezone: number;
    };
    "weather-GetWeatherResDto-DailyWeather": {
      /** @description 日期 */
      date: string;
      /** @description 最高温度 */
      high: number;
      /** @description 白天天气描述 */
      dayText: string;
      /** @description 白天天气代码 */
      dayCode: number;
      /** @description 白天风向 */
      dayWindDirection: string;
      /** @description 白天风力 */
      dayWindScale: string;
      /** @description 最低温度 */
      low: number;
      /** @description 夜晚天气描述 */
      nightText: string;
      /** @description 夜晚天气代码 */
      nightCode: number;
      /** @description 夜晚风向 */
      nightWindDirection: string;
      /** @description 夜晚风力 */
      nightWindScale: string;
    };
    "weather-GetWeatherResDto-NowWeather": {
      /** @description 降水量（mm） */
      precipitation: number;
      /** @description 气温（摄氏度） */
      temperature: number;
      /** @description 气压（hpa） */
      pressure: number;
      /** @description 相对湿度（%） */
      humidity: number;
      /** @description 风向描述 */
      windDirection: string;
      /** @description 风向角度 */
      windDirectionDegree: number;
      /** @description 风速等级 */
      windSpeed: number;
      /** @description 风速等级描述 */
      windScale: string;
      /** @description 体感温度（摄氏度） */
      feelst: number;
    };
    "weather-GetWeatherResDto": {
      /** @description 地区信息 */
      location: components["schemas"]["weather-GetWeatherResDto-Location"];
      /** @description 每日天气列表 */
      dailyWeatherList: components["schemas"]["weather-GetWeatherResDto-DailyWeather"][];
      /** @description 当前天气 */
      nowWeather: components["schemas"]["weather-GetWeatherResDto-NowWeather"];
      /** @description 最后更新时间 */
      lastUpdate: string;
    };
    "weather-GetExpressInfoResDto-MaterialRecord": {
      /** @description 物流发生时间戳 */
      time: number;
      /** @description 物流描述 */
      desc: string;
    };
    "weather-GetExpressInfoResDto": {
      /** @description 物流记录列表 */
      materialRecordList: components["schemas"]["weather-GetExpressInfoResDto-MaterialRecord"][];
      /** @description 快递公司 */
      company: string;
    };
    "express-QueryCompanyByOrderNumberResDto": {
      /** @description 快递公司 */
      company: string;
    };
    "cloudDisk-CreateDto": {
      /** @description 文件路径 */
      path: string;
      /**
       * @description 文件类型
       * @enum {string}
       */
      type: "directory" | "file";
      /** @description oss对象引用id */
      ossObjectRefId?: string;
    };
    "cloudDisk-FileItemDto": {
      /** @description 文件id */
      fileId: string;
      /** @description 文件名称 */
      fileName: string;
      /** @description 文件大小（字节） */
      fileSize?: number;
      /** @description MIME类型 */
      mimeType?: string;
      /**
       * @description 文件类型
       * @enum {string}
       */
      fileType: "directory" | "file";
      /** @description 文件路径 */
      filePath: string;
      /** @description 文件深度 */
      fileDepth: number;
      /** @description 父级路径 */
      parentPath: string;
      /** @description 创建时间戳 */
      createdTime: number;
      /** @description 更新时间戳 */
      updatedTime: number;
    };
    "cloudDisk-DeleteDto": {
      /** @description 文件路径 */
      path: string;
    };
    "cloudDisk-MoveDto": {
      /** @description 文件路径 */
      path: string;
      /** @description 父级路径 */
      parentPath: string;
    };
    "cloudDisk-RenameDto": {
      /** @description 文件路径 */
      path: string;
      /** @description 新文件名称 */
      newFileName: string;
    };
    "moments-SavePostDto": {
      /** @description 说说内容 */
      postContent: string;
      /** @description 媒体文件URL数组 */
      mediaUrls?: string[] | null;
      /** @description 说说id */
      postId?: string;
    };
    "moments-CreateUserDto": {
      /** @description 用户账号 */
      userAccount: string;
      /** @description 用户名称 */
      userName: string;
    };
    "moments-CommentDto": {
      /** @description 评论内容 */
      commentContent: string;
      /** @description 评论点赞数 */
      likeCount: number;
    };
    "moments-PostDto": {
      /** @description 说说id */
      postId: string;
      /** @description 说说内容 */
      postContent: string;
      /** @description 媒体文件URL数组 */
      mediaUrls?: string[] | null;
      /** @description 点赞数 */
      likeCount: number;
      /** @description 是否点过赞 */
      isLiked: boolean;
      /** @description 创建时间戳 */
      createdTime: number;
      /** @description 更新时间戳 */
      updatedTime: number;
      /** @description 创建用户信息 */
      createUser: components["schemas"]["moments-CreateUserDto"];
      /** @description 评论列表 */
      comments: components["schemas"]["moments-CommentDto"][];
    };
    "moments-DeletePostDto": {
      /** @description 说说id */
      postId: string;
    };
    "moments-LikePostDto": {
      /** @description 说说id */
      postId: string;
      /** @description 是否点赞 */
      isLike: boolean;
    };
    "moments-CommentPostDto": {
      /** @description 说说id */
      postId: string;
      /** @description 评论内容 */
      commentContent: string;
    };
    "moments-DeletePostCommentDto": {
      /** @description 评论id */
      commentId: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  AuthController_register: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["system-auth-RegisterDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  AuthController_login: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["system-auth-LoginDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["system-auth-LoginResDto"];
        };
      };
    };
  };
  AuthController_updateUserInfo: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["system-auth-UpdateUserInfoDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  AuthController_changePassword: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["system-auth-ChangePasswordDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  OssController_uploadCallback: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["oss-UploadCallbackDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": string;
        };
      };
    };
  };
  OssController_uploadFile: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["oss-UploadFileDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["oss-UploadFileResDto"];
        };
      };
    };
  };
  OssController_getPublicFileThumbnail: {
    parameters: {
      query: {
        /** @description oss object引用id */
        ossObjectRefId: string;
        /** @description 图片宽度 */
        imageWidth?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  OssController_getPublicFileDownloadUrl: {
    parameters: {
      query: {
        /** @description oss object引用id */
        ossObjectRefId: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": string;
        };
      };
    };
  };
  WeatherController_getCityWeatherList: {
    parameters: {
      query?: {
        /** @description 未来天数（0-6） */
        offsetDay?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["weather-GetCityWeatherListResDto"];
        };
      };
    };
  };
  WeatherController_getWeather: {
    parameters: {
      query?: {
        /** @description 站点id */
        stationid?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["weather-GetWeatherResDto"];
        };
      };
    };
  };
  ExpressController_getExpressInfo: {
    parameters: {
      query: {
        /** @description 快递单号 */
        orderNumber: string;
        /** @description 手机号 */
        phoneNumber?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["weather-GetExpressInfoResDto"];
        };
      };
    };
  };
  ExpressController_queryCompanyByOrderNumber: {
    parameters: {
      query: {
        /** @description 快递单号 */
        orderNumber: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["express-QueryCompanyByOrderNumberResDto"];
        };
      };
    };
  };
  CloudDiskController_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["cloudDisk-CreateDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["cloudDisk-FileItemDto"];
        };
      };
    };
  };
  CloudDiskController_delete: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["cloudDisk-DeleteDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CloudDiskController_move: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["cloudDisk-MoveDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["cloudDisk-FileItemDto"];
        };
      };
    };
  };
  CloudDiskController_rename: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["cloudDisk-RenameDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["cloudDisk-FileItemDto"];
        };
      };
    };
  };
  CloudDiskController_getInfo: {
    parameters: {
      query: {
        /** @description 文件路径 */
        path: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["cloudDisk-FileItemDto"];
        };
      };
    };
  };
  CloudDiskController_getList: {
    parameters: {
      query: {
        /** @description 文件父级路径 */
        parentPath: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["cloudDisk-FileItemDto"][];
        };
      };
    };
  };
  CloudDiskController_getFileThumbnail: {
    parameters: {
      query: {
        /** @description 文件路径 */
        filePath: string;
        /** @description 图片宽度 */
        imageWidth?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CloudDiskController_getFileDownloadUrl: {
    parameters: {
      query: {
        /** @description 文件路径 */
        filePath: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": string;
        };
      };
    };
  };
  CloudDiskController_getRecycleBinList: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["cloudDisk-FileItemDto"][];
        };
      };
    };
  };
  CloudDiskController_clearRecycleBin: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  MomentsController_savePost: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["moments-SavePostDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["moments-PostDto"];
        };
      };
    };
  };
  MomentsController_deletePost: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["moments-DeletePostDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  MomentsController_getPostList: {
    parameters: {
      query: {
        /** @description 页码 */
        pageNum: number;
        /** @description 每页条数 */
        pageSize: number;
        /** @description 搜索关键词 */
        keywords?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  MomentsController_likePost: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["moments-LikePostDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  MomentsController_commentPost: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["moments-CommentPostDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["moments-PostDto"];
        };
      };
    };
  };
  MomentsController_deletePostComment: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["moments-DeletePostCommentDto"];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
}
