# MySQL 初始化说明

## 文件说明

- `schema.sql`：初版建表脚本
- `seed.sql`：演示数据脚本

## 使用顺序

1. 先执行 `schema.sql`
2. 再执行 `seed.sql`

## 当前策略

- 当前采用最小可用核心表
- 角色画像中的部分扩展字段使用 `JSON`
- 后续新增 `book_dna`、`character_relations`、`feedbacks`、`reader_comments` 等模块时，建议通过增量表扩展
