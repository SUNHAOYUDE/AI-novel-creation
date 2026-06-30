# Debug Session: backend-connection-refused [OPEN]

## 1. 问题概述

- 现象：前端页面在 `作品管理` 与 `大纲管理` 中请求接口时报 `Network Error`
- 浏览器证据：`http://localhost:3000/api/books` 返回 `net::ERR_CONNECTION_REFUSED`
- 影响范围：`books`、`outlines` 相关真实接口全部不可用

## 2. 当前假设

1. 后端服务没有成功启动
2. 后端因数据库或环境变量问题启动后立即崩溃
3. 运行时加载了错误的编译产物或启动命令失败
4. 前端地址或 CORS 有误，但优先级较低

## 3. 已执行操作

- 已建立调试会话文件
- 已尝试在当前环境直接执行 `npm run start:dev`
- 已为 `scripts/start-dev.ps1` 添加前后端日志落盘到 `.runtime/frontend.log` 与 `.runtime/backend.log`
- 已为 `scripts/start-dev.ps1` 添加 `.runtime/startup-status.log`，记录进程存活与 `3000` 端口访问状态
- 已为 `scripts/start-dev.ps1` 添加 `backend.stdout.log` 与 `backend.stderr.log` 输出

## 4. 证据记录

- 浏览器控制台报错：`http://localhost:3000/api/books` -> `net::ERR_CONNECTION_REFUSED`
- 当前环境直接执行 `npm run start:dev` 未进入应用启动阶段，终端停在沙箱确认提示，因此尚未取得 Nest/Prisma 真正启动日志
- `backend/.env` 中 `PORT=3000`，与前端请求地址一致
- 启动脚本现已记录：
  - `.runtime/frontend.log`
  - `.runtime/backend.log`
  - `.runtime/startup-status.log`
- 最新状态文件显示：
  - `backendAlive=True`
  - `mysqlPortOpen=True`
  - `port3000OwnerPids=`（无监听者）
  - `backendProbeHistory` 连续 3 次超时
- 这说明：
  - 后端进程未退出
  - MySQL 端口可达
  - 但应用没有真正监听 `3000`
- 后续关键证据：
  - `backend.stdout.log` 显示：
    - `Starting compilation in watch mode...`
    - `src/common/prisma.service.ts:11:14 - error TS2345`
    - `Argument of type '"beforeExit"' is not assignable to parameter of type 'never'`
    - `Found 1 error. Watching for file changes.`
- 结论更新：
  - 根因不是数据库不可达，而是 TypeScript 编译错误导致 Nest 一直停留在 watch 编译阶段，应用从未监听 `3000`
- 已实施最小修复：
  - 删除 `PrismaService.enableShutdownHooks()` 中不兼容的 `$on("beforeExit")`
  - 删除 `main.ts` 中对应调用
- 修复后新证据：
  - `backend.stdout.log` 显示 `Found 0 errors. Watching for file changes.`
  - `backend.stderr.log` 显示 `Cannot find package 'dotenv' imported from dist/main.js`
- 新结论：
  - 编译问题已修复
  - 当前阻塞点为本地依赖未更新，`backend/node_modules` 中缺少 `dotenv`
- 已实施第二个修复：
  - 更新 `scripts/setup.ps1`，当 `package.json` 或 `package-lock.json` 比 `node_modules` 新时自动执行 `npm install`

## 5. 结论

- 暂无
