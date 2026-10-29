# Lab1 Phase 1 — SVG CLI 编辑器

仓库地址：[https://github.com/Evil-Genus/lab1](https://github.com/Evil-Genus/lab1)

TypeScript 面向对象实现，支持六种图形、树结构编辑、SVG 文件读写与 Command 撤销重做。

## 运行

需要 Node.js 20 或更新版本。

```sh
npm ci
npm run cli
```

交互提示符为 `svg>`，输入 `help` 查看语法。Ctrl+C 或 EOF 退出。
双引号包裹带空格参数；仅整行以 `#` 开头时视为注释，颜色如 `#4a90d9` 不受影响。

```text
init 800 600
create g scene
create rect r1 10 20 100 50 red in scene
move scene 30 0
undo
save demo.svg
```

浏览器直接打开生成的 SVG 预览。交互外也支持标准输入脚本（批处理不打印提示符）：

```powershell
Get-Content -Encoding utf8 examples/flowchart.txt | npm run cli
```

macOS/Linux：`npm run cli < examples/flowchart.txt`。

## 检查

```sh
npm run check
npm test
npm run build
node dist/src/main.js
```

错误命令输出 `error:` 并继续会话；单条错误不会改变文档或撤销历史。IO 操作成功后设置历史屏障，下一条成功编辑解除屏障。

## 范围与文档

[架构、设计模式、过程记录和质量自查](doc/README.md)；[原始任务](doc/phase_cli_1.md)。

本阶段支持 rect/circle/ellipse/line/text/g，box 属后续阶段。读入支持的 SVG 子集，遇到不支持的元素或属性明确报错。跨父级分组、导入变换、默认值等约定见架构文档。

