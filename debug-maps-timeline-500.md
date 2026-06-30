[OPEN] maps-timeline-500

## 现象
- 地图系统创建时前端提示：Internal server error
- 时间线创建时前端提示：Internal server error

## 期望
- 创建地图/时间线应返回 code=0 的成功响应，并在列表中出现新条目

## 环境
- Frontend: Vite + React
- Backend: NestJS + Prisma + MySQL

## 复现步骤
1. 打开某本书的「地图系统」页面，填写最小字段后点击创建
2. 打开某本书的「时间线」页面，填写最小字段后点击创建

## 假设（可证伪）
- A：创建地图的 SQL 执行失败（占位符数量/列名不一致/外键约束/字段类型）导致 500
- B：创建时间线的 SQL 执行失败（外键 related_map_id、字段类型、约束）导致 500
- C：请求 payload 中 bookId / relatedMapId / parentId 类型不正确，触发 BigInt 转换或 SQL 绑定错误导致 500
- D：写审计日志时失败（audit_logs 表/字段/序列化）导致 500
- E：创建后回查/DTO 映射阶段出错（日期/JSON 解析）导致 500

## 采证计划
- 启动 Debug Server 收集后端运行时异常（包含 route、payload、stack、traceId）
- 在 world-maps / timeline-events create 入口与异常捕获处插桩上报

