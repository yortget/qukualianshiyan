# ChainScope Terminal Bridge

本地 VS Code 扩展：让 ChainScope 前端在 VS Code 的终端页签中自动创建两个后端节点。

它只负责创建终端、输入命令，不修改 `blockchaindemo` 的链逻辑，也不修改现有 HTTP 接口。

## 安装

推荐使用打包好的 VSIX：

1. 打开 VS Code；
2. `Ctrl+Shift+P` → `Extensions: Install from VSIX...`；
3. 选择 `vscode-extension/chainscope-terminal-bridge-0.1.3.vsix`；
4. 重新加载 VS Code。

开发模式也可以直接打开 `vscode-extension` 目录，按 `F5` 启动 Extension Development Host。

## 启动顺序

1. **用 VS Code 打开整个项目根目录**（包含 `blockchaindemo/` 和 `frontend/`）。
2. 前端运行：

   ```bash
   cd frontend
   npm run dev
   ```

3. 打开前端页面，在左侧 `// VS CODE / 终端托管` 中设置两个 P2P 端口（默认 `2727`、`2828`）。
4. 点击 `在 VS Code 中启动`。
5. VS Code 终端页签中会自动出现：

   ```text
   节点 A · P2P 2727
   节点 B · P2P 2828
   ```

   扩展会自动执行 `npm run start`、`open`、`connect localhost 2727`。
6. 前端既有的节点发现会读取两个节点的 API（正常为 `3001`、`3002`），并显示区块链数据。
7. 前端挖矿仍然走原有 `/mineBlock`，后端负责 P2P 广播。

## 说明

- 扩展启动时在本机 `127.0.0.1:3100` 提供控制接口；只接受 localhost 来源。
- 前端不直接执行命令，也不修改后端业务逻辑。
- 扩展不会自动启动节点；只有点击前端按钮或执行命令时才会创建终端。
- 关闭终端页签即可停止对应节点；前端“停止”按钮会关闭由扩展创建的终端。
- 如果项目根目录不是 VS Code 当前工作区，扩展会找不到 `blockchaindemo/`，请重新打开正确目录。

## 开发自检

```bash
node test/control-server.test.js
```
