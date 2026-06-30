# Debug Session: windows-startup-fail [OPEN]

## 1. 问题概述

- 现象：用户反馈一键启动脚本“启动不了”
- 范围：`start-dev.bat` -> `scripts/start-dev.ps1` -> `scripts/setup.ps1`
- 当前阶段：建立假设并准备复现

## 2. 当前假设

1. `start-dev.bat` 到 PowerShell 的调用链异常
2. `setup.ps1` 的目录或文件路径解析异常
3. `npm`/依赖环境导致子进程立即退出
4. 启动脚本中的旧进程清理逻辑异常

## 3. 已执行操作

- 已建立调试会话文件
- 已在 `scripts/setup.ps1` 和 `scripts/start-dev.ps1` 中增加调试输出
- 待用户执行脚本并回传输出

## 4. 证据记录

- 用户复现输出显示：
  - `[debug][start] rootDir=E:\AI novel creation`
  - `[debug][start] backendDir=E:\AI novel creation\backend`
  - 解析错误落在 `scripts/setup.ps1` 的中文字符串位置
  - 错误类型为 `ParserError`，包含“表达式或语句中包含意外的标记”和“字符串缺少终止符”
- 由此可确认：
  - 批处理入口正常
  - 路径计算正常
  - 失败发生在 PowerShell 5 解析脚本内容阶段
- 修复动作：
  - 将 `setup.ps1`、`start-dev.ps1`、`stop-dev.ps1`、`restart-dev.ps1` 中的运行时文本替换为 ASCII
  - 不改启动逻辑，只修复脚本可解析性
- 修复后校验：
  - 编辑器诊断无错误
  - 脚本文本解析校验通过
- 用户二次复现输出显示：
  - `Previous runtime record found, stopping old processes first...`
  - `Found previous runtimeFile, calling stop-dev.ps1`
  - `Unable to overwrite variable PID` / `VariableNotWritable`
  - 报错定位在 `scripts/stop-dev.ps1:23` 的 `foreach ($pid in $pidList)`
- 由此可确认：
  - 旧进程清理逻辑确实进入执行
  - 新根因是脚本变量名 `$pid` 与 PowerShell 自动变量 `$PID` 冲突
- 最小修复：
  - 将循环变量由 `$pid` 改为 `$processId`
- 修复后验证：
  - `stop-dev.ps1` 诊断通过
  - 命令执行退出码为 `0`

## 5. 结论

- 第一层根因：PowerShell 5 解析含中文字符串的脚本文件时发生编码兼容问题，导致脚本在执行前即触发 `ParserError`
- 第二层根因：`stop-dev.ps1` 使用 `$pid` 作为循环变量，和 PowerShell 只读自动变量 `$PID` 冲突
- 当前状态：已完成最小修复，等待用户再次验证
