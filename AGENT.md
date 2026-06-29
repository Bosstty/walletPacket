# AGENT.md

## 项目定位

- 项目名称：`walletPacket`
- 目标形态：个人日常记账微信小程序
- 产品边界：只做个人收支记录、账单整理、分类查看、月度统计、预算管理
- 明确不做：理财建议、投资分析、贷款、支付结算、银行卡同步、外部金融导流

## 仓库结构

- 前端仓库：`C:\Users\lly\WeChatProjects\walletPacket`
- 后端仓库：`C:\Users\lly\WeChatProjects\walletPacketBackend`

## 当前技术路线

### 前端

- 使用：原生微信小程序
- 语言：JavaScript
- UI 策略：克制、轻量、有完成度，不走 demo 风格
- 页面：
  - `pages/home`
  - `pages/transaction-form`
  - `pages/bills`
  - `pages/stats`
  - `pages/profile`

### 后端

- 使用：NestJS
- ORM：Prisma
- 数据库：MySQL 8
- Prisma 连接方式：`@prisma/client + @prisma/adapter-mariadb`

## 前端开发规范

- 不要再恢复微信默认模板页，例如 `pages/index` / `pages/logs`
- 所有接口请求统一走：
  - `utils/request.js`
  - `services/*.js`
- 不允许在页面里直接写裸 `wx.request`
- 登录态统一走：
  - `utils/session.js`
  - `utils/storage.js`
- 页面只负责：
  - 交互
  - 页面状态
  - 调用 service
- 业务格式化统一放在：
  - `utils/format.js`

## 前端样式规范

- 保持当前视觉方向：
  - 浅暖背景
  - 高质感卡片
  - 低饱和强调色
  - 少量有意义动效
- 不要引入强烈紫色风格
- 不要把页面改回白底黑字的默认模板感
- 动效只服务于：
  - 数据入场
  - 切换反馈
  - 重点操作确认
- 不要为了炫技增加复杂动画导致记账效率下降

## 后端接口规范

- API 前缀固定：`/api/v1`
- 当前已接入接口：
  - `POST /auth/dev-login`
  - `GET /users/me`
  - `PATCH /users/settings`
  - `GET /categories`
  - `POST /categories`
  - `POST /transactions`
  - `GET /transactions`
  - `GET /transactions/:id`
  - `PATCH /transactions/:id`
  - `DELETE /transactions/:id`
  - `GET /budgets`
  - `PUT /budgets/overall`
  - `PUT /budgets/category`
  - `GET /stats/home`
  - `GET /stats/monthly`

## 数据与金额规范

- 金额统一使用 `amountCent`
- 前端展示时再格式化为元
- 时间统计口径按 `Asia/Shanghai`
- 月份格式统一：`YYYY-MM`
- 日期格式统一：`YYYY-MM-DD`

## 登录规范

- 当前前端联调阶段使用 `dev-login`
- `dev-login` 仅用于开发，不是上线方案
- 上线前必须替换为：
  - 小程序 `wx.login`
  - 后端 `code2Session`
  - 正式用户鉴权流程

## 环境配置规范

- 当前开发接口地址配置在：
  - `utils/config.js`
- 本机联调可使用：
  - `http://127.0.0.1:3000/api/v1`
- 真机联调和提审前必须替换为：
  - 服务器 `https` 域名
  - 并配置到微信小程序合法 request 域名

## 数据库规范

- 当前数据库：`walletPacket`
- 远程 MySQL 已建表
- 默认分类种子脚本已存在于后端仓库
- 新增表或字段时：
  - 先改 Prisma schema
  - 再同步数据库
  - 再更新前端接口使用方式

## 编码规范

- 修改现有文件时，优先延续当前风格，不要混入多套风格
- 尽量使用 ASCII；中文仅用于业务文案
- 避免在 WXML 写复杂表达式
- 页面复杂派生数据优先在 JS 中整理后再渲染
- 不要把临时调试逻辑长期留在页面代码里

## 开发顺序约束

- 后续优先级：
  1. 完成前端联调与交互修正
  2. 接真实微信登录
  3. 补分类编辑/启停
  4. 补预算删除或关闭
  5. 视需要补导出、搜索等延期能力

## 审核与合规约束

- 文案避免出现：
  - 理财
  - 投资
  - 收益
  - 贷款
  - 提现
  - 支付
- 产品文案应始终表述为：
  - 个人记账
  - 收支记录
  - 账单整理
  - 月度统计

## 禁止事项

- 不要引入支付能力
- 不要接金融相关服务
- 不要把项目扩展成多端大而全框架
- 不要为了“练手”引入与当前阶段无关的重型架构

