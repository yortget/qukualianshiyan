const P2p = require("./P2p");
const Blockchain = require("./Blockchain");
const express = require("express");
const cors = require("cors");
const blockchain = new Blockchain();
const p2p = new P2p(blockchain);
// 主函数：初始化cli命令行页面
function cli(vorpal) {
  autoStartApi(vorpal);
  vorpal
    .use(welcome)
    .use(connectCommand)
    .use(discoverCommand)
    .use(blockchainCommand)
    .use(peersCommand)
    .use(mineCommand)
    .use(openCommand)
    .use(apiCommand)
    .delimiter("blockchain>>>>>>>>> ")
    .show();
}

// 欢迎指令
function welcome(vorpal) {
  vorpal.log("欢迎来到blockchain命令行界面");
  vorpal.exec("help");
}
// 连接节点指令
function connectCommand(vorpal) {
  vorpal
    .command(
      "connect <host> <port>",
      "Connect to a new peer.eg: connect localhost 2727",
    )
    .alias("c")
    .action(function (args, callback) {
      if (args.host && args.port) {
        try {
          p2p.connectToPeer(args.host, args.port);
        } catch (err) {
          this.log(err.message);
        }
      }
      callback();
    });
}
// 发现节点指令，发现网络中的其他节点
function discoverCommand(vorpal) {
  vorpal
    .command("discover", "Discover new peers from your connected peers.")
    .alias("d")
    .action(function (args, callback) {
      try {
        p2p.discoverPeers();
      } catch (err) {
        this.log(err.message);
      }
      callback();
    });
}
// 区块链查看指令，显示当前区块链的所有完整信息
function blockchainCommand(vorpal) {
  vorpal
    .command("blockchain", "Show the current blockchain.")
    .alias("bc")
    .action(function (args, callback) {
      this.log(blockchain);
      callback();
    });
}
// 节点查看指令
function peersCommand(vorpal) {
  vorpal
    .command("peers", "Show the current peers.")
    .alias("p")
    .action(function (args, callback) {
      if (p2p.peers.length === 0) {
        this.log("No peers connected.");
      } else {
        this.log(`已连接的节点数量: ${p2p.peers.length}`);
        p2p.peers.forEach((peer, index) => {
          const host = peer.peerInfo?.host || peer.remoteAddress || "Unknown";
          const port = peer.peerInfo?.port || peer.remotePort || "Unknown";
          this.log(`Node ${index + 1}: ${host}:${port}`);
        }, this);
      }
      callback();
    });
}
// 挖矿指令
function mineCommand(vorpal) {
  vorpal
    .command("mine <data>", "Mine a new block. eg. mine 'hello111111'")
    .alias("m")
    .action(function (args, callback) {
      if (args.data) {
        blockchain.mine(args.data);
        p2p.broadcastLatest();
      }
      callback();
    });
}
// 开启端口指令
function openCommand(vorpal) {
  vorpal
    .command("open <port>", "Open a port for P2P communication. eg. open 2727")
    .alias("o")
    .action(function (args, callback) {
      const port = Number(args.port);
      if (Number.isInteger(port) && port > 0 && port < 65536) {
        p2p.startServer(port);
        this.log(`Server is running on port ${port}`);
      } else {
        this.log("Port not xing.");
      }
      callback();
    });
}
// 开启api指令
function apiCommand(vorpal) {
  vorpal
    .command("api <port>", "Start api server. eg. api 3001")
    .alias("a")
    .action(function (args, callback) {
      const port = Number(args.port);
      if (Number.isInteger(port) && port > 0 && port < 65536) {
        initHttpServer(port, { source: "manual" });
      } else {
        this.log("Port not xing.");
      }
      callback();
    });
}

function initHttpServer(port, { source = "manual", onBusy = null } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/blocks", (req, res) => {
    res.send(blockchain.blockchain);
  });

  app.post("/mineBlock", (req, res) => {
    const data = req.body.data;
    if (data == null) {
      res.status(400).send("data parameter is missing.");
      return;
    }
    blockchain.mine(data);
    const newBlock = blockchain.latestBlock;
    p2p.broadcastLatest();
    res.send(newBlock);
  });

  app.get("/peers", (req, res) => {
    res.send(
      p2p.peers.map((s) => {
        const host = s.peerInfo?.host || s.remoteAddress;
        const port = s.peerInfo?.port || s.remotePort;
        return `${host}:${port}`;
      }),
    );
  });

  app.get("/nodeInfo", (req, res) => {
    res.send({
      p2pPort: p2p.serverPort,
      apiPort: port,
      blockCount: blockchain.blockchain.length,
    });
  });

  app.post("/addPeer", (req, res) => {
    const peer = String(req.body.peer || "");
    const separator = peer.lastIndexOf(":");
    const host = separator > 0 ? peer.slice(0, separator) : "";
    const port = Number(peer.slice(separator + 1));
    if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
      res.status(400).send("peer must be host:port");
      return;
    }
    p2p.connectToPeer(host, port);
    res.send();
  });

  const server = app.listen(port);

  server.on("listening", () => {
    console.log(
      `[api] ${source === "auto" ? "自动" : "手动"}启动成功: http://localhost:${port}`,
    );
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && onBusy) {
      onBusy();
      return;
    }
    console.error(`[api] 端口 ${port} 启动失败: ${error.message}`);
  });

  return server;
}

// 实验步骤里只输入 open / connect / mine / blockchain，不会手动输入 api。
// 为了让前端能读到同一个进程里的链，启动 CLI 时自动在 3001-3004 中选一个空闲端口。
const API_CANDIDATE_PORTS = [3001, 3002, 3003, 3004];
let autoApiStarted = false;

function autoStartApi(vorpal) {
  if (autoApiStarted) return;
  autoApiStarted = true;

  const log = typeof vorpal?.log === "function" ? vorpal.log.bind(vorpal) : console.log;

  const tryPort = (index) => {
    if (index >= API_CANDIDATE_PORTS.length) {
      log("⚠️ 未找到空闲的 API 端口（3001-3004），前端将无法读取本节点数据。");
      return;
    }

    const port = API_CANDIDATE_PORTS[index];
    initHttpServer(port, {
      source: "auto",
      onBusy: () => tryPort(index + 1),
    });
  };

  tryPort(0);
}

module.exports = cli;
module.exports.initHttpServer = initHttpServer;
module.exports.autoStartApi = autoStartApi;
