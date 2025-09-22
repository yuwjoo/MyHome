# IR 华蒜空调状态接口文档

## 接口说明
本接口用于更新华蒜空调的状态数据，并将数据存储到MySQL数据库中。系统会永远只保留最后一条记录，判断逻辑为取请求时间戳最大的数据记录。

## 接口地址
```
POST /ir/huaShuan/updateHuaShuanState
```

## 请求参数
请求数据为JSON格式，包含以下字段：

| 字段名 | 类型 | 描述 | 约束条件 |
|-------|------|------|---------|
| temperature | 整数 | 空调温度 | 范围：16-30度 |
| isCooling | 布尔值 | 是否制冷 | 必须为true或false |
| isHeating | 布尔值 | 是否制热 | 必须为true或false |
| windSpeed | 整数 | 风速 | 范围：0-3（0表示自动，1-3表示低中高风速） |
| isSwinging | 布尔值 | 是否摆风 | 必须为true或false |
| timerTimestamp | 整数 | 定时时间戳 | 必须为正整数 |
| timerDuration | 整数 | 定时时长（分钟） | 范围：0-1440（最大定时24小时） |
| requestTimestamp | 整数 | 请求时间戳 | 必须为正整数，用于判断记录新旧 |

## 请求示例
```json
{
  "temperature": 24,
  "isCooling": true,
  "isHeating": false,
  "windSpeed": 2,
  "isSwinging": true,
  "timerTimestamp": 1634567890000,
  "timerDuration": 60,
  "requestTimestamp": 1634567900000
}
```

## 响应示例
### 成功响应
```json
{
  "success": true,
  "message": "空调状态更新成功"
}
```

### 失败响应 - 已有更新记录
```json
{
  "success": false,
  "message": "已有更新的记录，无需更新"
}
```

### 失败响应 - 更新失败
```json
{
  "success": false,
  "message": "更新失败，请稍后重试"
}
```

## 系统配置要求
### MySQL数据库配置
在使用前，请确保在 `src/app.module.ts` 文件中正确配置MySQL数据库连接信息：

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost', // MySQL主机地址
  port: 3306, // MySQL端口
  username: 'root', // MySQL用户名
  password: 'password', // MySQL密码
  database: 'my_home_server', // 数据库名称
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true, // 仅在开发环境使用，生产环境请设置为false
}),
```

### 数据库准备
请确保MySQL服务器已启动，并已创建了指定的数据库（默认为 `my_home_server`）。TypeORM的 `synchronize: true` 配置会自动创建所需的表结构。

## 启动服务
```bash
npm run start:dev
```

服务启动后，可通过 `http://localhost:3000/ir/huaShuan/updateHuaShuanState` 访问接口。