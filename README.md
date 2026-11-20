# 区块链 P2P 实验 · Blockchain Visualization

一个基于 TCP P2P 网络的最小区块链演示，以及配套的 Vue 3 可视化前端。前端读取后端 HTTP API，实时展示当前节点、可用节点、P2P 连接与完整区块链数据。

后端在 CLI 启动时会自动在 `3001-3004` 中选一个空闲端口启动 HTTP API，因此按下面实验步骤只输入 `open` / `connect` / `mine` / `blockchain` 即可，不需要再手动输入 `api`。

## 技术栈

- **后端**：Node.js + Vorpal（命令行）+ Express + TCP P2P，SHA-256 工作量证明（难度 3）
- **前端**：Vue 3 `<script setup>` + Vite，原生 `fetch`，无额外运行时依赖

## 目录结构

```text
qukualianshiyan/
├─ blockchaindemo/          # 区块链与 P2P 后端
│  ├─ Block.js              # 区块结构（含创世区块）
│  ├─ Blockchain.js         # 挖矿、校验、替换链
│  ├─ P2p.js                # TCP P2P 节点
│  ├─ cli.js                # 命令行、HTTP API 与自动 API 启动
│  └─ index.js              # 入口
├─ frontend/                # Vue 3 可视化前端
│  ├─ src/api/              # 节点 API 客户端
│  ├─ src/composables/      # 节点发现与轮询
│  ├─ src/components/       # 页面组件
│  └─ src/utils/            # 时间、数据格式化
└─ vscode-extension/        # 可选：VS Code 终端托管扩展
   ├─ extension.js
   ├─ lib/controlServer.js
   ├─ test/control-server.test.js
   └─ chainscope-terminal-bridge-0.1.3.vsix
```

## 启动后端（实验步骤）

### 终端 1：节点 A（P2P 2727）

```bash
cd blockchaindemo
npm run start
```

进入 `blockchain>>>>>>>>>` 交互命令行后依次输入：

```text
open 2727
blockchain
mine "1111"
blockchain
```

### 终端 2：节点 B（P2P 2828）

新开一个终端：

```bash
cd blockchaindemo
npm run start
```

进入交互命令行后依次输入：

```text
open 2828
connect localhost 2727
blockchain
mine "asdsad"
```

### 回到终端 1 验证同步

```text
blockchain
```

此时 2727 和 2828 两个节点的链应完全一致，代表 P2P 同步成功。API 会自动启动：终端 1 通常使用 `3001`，终端 2 通常使用 `3002`；如果端口被占用，会顺延到 `3003`、`3004`。

> `open`、`connect`、`mine`、`blockchain` 是项目 CLI 内的命令，不是系统终端命令，必须先 `npm run start` 进入交互控制台。

## 启动前端

```bash
cd frontend
npm install
npm run dev
```

打开终端提示的地址（默认 `http://localhost:5173`）。生产构建：

```bash
npm run build
npm run preview
```

## 可选：从 VS Code 终端一键启动两个后端

如果希望在 VS Code 的终端页签里自动打开两个后端节点，而不是手动开两个系统终端，可以安装仓库内的本地扩展：

```bash
code --install-extension vscode-extension/chainscope-terminal-bridge-0.1.3.vsix
```

安装后重启（或重新加载）VS Code，并继续用 VS Code 打开整个 `qukualianshiyan` 文件夹。

1. 先在另一个终端启动前端：`cd frontend && npm run dev`。
2. 打开前端页面，左侧栏会出现 **“VS CODE / 终端托管”**。
3. 确认节点 A 的 P2P 端口为 `2727`、节点 B 的 P2P 端口为 `2828`（API 端口可留空自动分配），点击 **“在 VS Code 中启动”**。
4. 扩展会在 VS Code 终端区创建两个页签 `节点 A · P2P 2727`、`节点 B · P2P 2828`，并依次执行：
   - `npm run start`
   - 节点 A：`open 2727`
   - 节点 B：`open 2828`、`connect localhost 2727`

启动完成后前端的节点栏会自动出现两个节点；原有的手动启动方式不受影响，扩展不会自动启动任何终端。点击“停止”会关闭扩展创建的两个终端页签，本地桥接服务在 VS Code 窗口期间保持运行，方便再次启动。

> 本地桥接只监听 `127.0.0.1:3100`，只接受来自本机前端（`localhost` / `127.0.0.1`）的请求；前端未检测到扩展时，该面板显示“未检测到 VS Code 扩展”，其余功能照常使用。也可以直接打开 `vscode-extension/` 文件夹按 F5 调试扩展。

## 前后端数据一致性

- 前端只展示通过 `/nodeInfo` 探测到的节点，不读取任何本地假数据。
- 页面显示的区块来自当前选中节点的 `/blocks`；侧栏节点卡片的区块数也来自同一份链数据。
- 默认每 2 秒轮询一次；请求带 `cache: 'no-store'`，避免浏览器缓存旧数据。
- 当前选中节点不可达时，页面会保留最后一次同步的链并标记“未连接”，不会静默切换到另一个节点、导致看到的链突然变化。
- 自动 API 与 CLI 在同一个 Node 进程中，`blockchain` 命令和前端读取的是同一个 `blockchain` 实例。

## 节点地址配置

前端默认探测 `http://<当前页面主机名>:3001` 至 `:3004`，只展示能够访问 `/nodeInfo` 的节点。

- 环境变量：在 `frontend/.env.local` 中设置

  ```env
  VITE_NODE_APIS=http://localhost:3001,http://localhost:3002
  ```

- 地址栏参数：`?nodes=3001,3002` 或 `?nodes=http://192.168.1.10:3001,http://192.168.1.10:3002`

## 手动启动 API（一般不需要）

CLI 启动时已经自动启动 API，实验步骤不需要再输入 `api`。只有在需要额外端口时才手动执行：

```text
api 3005
```

并让前端通过 `?nodes=3005` 访问；不要重复使用已被自动 API 占用的端口。

## 常见问题

- 页面显示“未发现可用节点”：确认两个后端终端都已 `npm run start`，且出现 `[api] 自动启动成功`。
- 如果侧栏 API 端口是 `3003`、`3004`：说明 `3001`、`3002` 已被其他进程占用，自动 API 已顺延；前端会一并探测，不需要改代码。
- 如果页面链和 `blockchain` 命令输出不一致：先关闭以前残留的 `node` 进程/旧终端，再重新启动两个节点并刷新页面；前端请求已禁用缓存。

## 页面功能

界面为《明日方舟：终末地》式的工业档案 / 编辑风仪表盘：纸灰底、石墨黑墨线、信号荧光黄与少量品红/薄荷三色页眉；`//` 技术标签、细线等高线、自托管的 Saira 宽度字体、超大标题与真实区块计数；背景带淡灰 → 深灰 → 淡灰的缓慢渐变动画（支持系统“减少动态效果”）。左侧是节点与数据源控制栏，右侧展示链上概览和区块列表。

- **当前节点与连接状态**：顶部显示所选节点的 P2P 端口、API 端口、连接状态和最近更新时间。
- **数据源（侧栏）**：列出所有可达节点及其 P2P 端口、API 端口与区块数量，点击卡片即可切换数据源；当前节点以信号荧光黄高亮。
- **前端挖掘新区块（侧栏）**：选中任意可达节点后，在“新建区块 / MINE”区域输入数据并点击“挖掘新区块”，等价于在该节点终端执行 `mine "数据"`；挖掘成功后通过现有 P2P 广播自动同步到已连接节点，切换数据源即可看到同一笔区块数据。
- **刷新链数据**：立即拉取所选节点的最新区块和 P2P 连接。
- **自动刷新 2s**：默认开启，每 2 秒轮询节点与链数据；关闭后只能手动刷新，页面切到后台时自动暂停。
- **链上概览**：区块高度、P2P 连接数、最新出块时间和当前刷新模式。
- **链上区块**：展示 `BLOCK #index`、本地时间、Hash、Prev Hash、Data、Nonce，Hash 支持一键复制；区块之间以细线链路连接。
- **状态反馈**：首次加载、节点不可达、空链和中途断连都有对应提示；断连时保留最后一次同步的数据并显示警告条。

> 后端时间戳为毫秒级 Unix 时间，前端按浏览器本地时区格式化为 `YYYY-MM-DD HH:mm:ss`。

### 认证与安全

本演示仅用于教学实验，HTTP API 默认无鉴权并监听本机端口，请勿直接暴露到公网。
