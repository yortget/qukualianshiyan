# ChainScope · 区块链可视化前端

Vue 3 + Vite 实现的区块链 P2P 演示面板。页面通过后端 HTTP API 读取节点信息和完整区块链数据，默认每 2 秒轮询刷新。

后端 CLI 启动时会自动在 `3001-3004` 中选一个空闲端口启动 API，因此前端启动后会自动发现这些节点，不需要额外配置。

- 《明日方舟：终末地》式的浅色工业档案 / 编辑风界面：纸灰底、石墨黑、信号荧光黄、三色页眉、`//` 技术标签、细线等高线与自托管 Saira 宽度字体；背景带淡灰 → 深灰 → 淡灰的缓慢渐变动画，左侧节点/数据源栏，右侧链上概览与区块卡片；当前区块用信号黄标记。
- 字体文件位于 `public/fonts/`（Saira，SIL Open Font License，许可文本见 `Saira-OFL.txt`）；等高线素材位于 `public/contours/`。
- 背景灰度动画与等高线漂移都使用 GPU 合成层（`transform`），滚动时不触发整页重绘；系统开启“减少动态效果”时自动静止。
- 视觉规范参考 [hhikr/endfield-ui-skill](https://github.com/hhikr/endfield-ui-skill)（仅作设计参考，未引入其运行时代码或依赖）。
- 自动探测 `:3001` 至 `:3004` 上的节点 API，只展示可访问 `/nodeInfo` 的节点。
- 支持点击节点切换数据源、手动刷新、自动刷新开关、Hash 一键复制。
- 侧栏新增“新建区块 / MINE”区域：选中节点后输入数据即可在对应端口挖掘新区块，效果等价于该节点 CLI 的 `mine "数据"`；挖掘成功会走现有 P2P 广播，已连接的节点会同步该区块。
- 侧栏新增“VS CODE / 终端托管”区域：检测到本地扩展后，可从页面一键在 VS Code 终端页签启动两个后端节点；未检测到扩展时保持原样，手动启动流程完全不受影响。扩展与安装方式见 [vscode-extension/README.md](../vscode-extension/README.md)。
- 加载、空链、断连、超时等状态均有提示；当前节点掉线时保留最后一次同步的链，不会静默切换数据源。

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## 节点地址

默认探测当前页面主机名的 `3001` 至 `3004` 端口，也可以通过环境变量或地址栏覆盖：

```env
VITE_NODE_APIS=http://localhost:3001,http://localhost:3002
```

```text
http://localhost:5173/?nodes=3001,3002
```

更多后端启动方式和接口说明见仓库根目录的 [README](../README.md)。
