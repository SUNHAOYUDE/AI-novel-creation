# AI 小说生成系统

这是一个前后端分离的初版壳子工程，基于 `React + Vite + TypeScript` 前端、`NestJS + Prisma + MySQL` 后端构建。

## 目录结构

```text
.
├─ frontend/          # 前端壳子
├─ backend/           # 后端壳子
├─ database/          # MySQL 初始化脚本与种子数据
├─ docs/              # 预留文档目录
└─ .trae/documents/   # PRD 与技术架构文档
```

## 当前状态

- 已完成前端页面壳子与路由结构
- 已完成后端模块壳子与占位 API
- 已完成 MySQL 初版表结构脚本
- 已完成作品管理模块的真实 CRUD 链路
- 已接入 DeepSeek 服务端环境变量配置

## 前端模块

- 工作台
- 作品管理
- 大纲管理
- 角色管理
- 伏笔与情节
- 章节工作台
- 系统设置

## 后端模块

- `books`
- `characters`
- `outlines`
- `foreshadows`
- `chapters`
- `common`
- `providers`
- `events`

## 已实现功能

- 作品列表读取
- 新建作品
- 编辑作品
- 删除作品
- AI 大纲生成
- 大纲列表按作品读取
- 后端通过 Prisma 连接 MySQL
- 服务端预留 DeepSeek 调用底座

## 数据库

- `database/schema.sql`：初版建表脚本
- `database/seed.sql`：初版演示数据

## 一键启动

### 方式 1：命令行启动

在根目录执行：

```bash
npm run start:dev
```

该命令会自动：

- 检查并安装 `frontend` 依赖
- 检查并安装 `backend` 依赖
- 如果 `backend/.env` 不存在，则自动根据 `.env.example` 创建
- 分别在两个新的 PowerShell 窗口中启动前端和后端

### 方式 2：双击启动

直接双击根目录下的：

```text
start-dev.bat
```

## 一键停止

### 命令行停止

在根目录执行：

```bash
npm run stop:dev
```

### 双击停止

直接双击根目录下的：

```text
stop-dev.bat
```

## 一键重启

### 命令行重启

在根目录执行：

```bash
npm run restart:dev
```

### 双击重启

直接双击根目录下的：

```text
restart-dev.bat
```

### 默认地址

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3000/api`

### 运行机制

- 启动脚本会把前后端 PowerShell 进程信息记录到 `.runtime/dev-processes.json`
- 重复启动时会优先尝试清理旧进程，避免端口冲突
- 停止脚本会根据记录的 PID 停止前后端开发进程

## 后续建议

1. 安装前后端依赖
2. 启动 MySQL 并执行初始化脚本
3. 连接 Prisma 和真实数据库
4. 将占位 Repository 替换为真实数据库访问
5. 逐步实现作品、大纲、角色、伏笔、章节模块业务能力
