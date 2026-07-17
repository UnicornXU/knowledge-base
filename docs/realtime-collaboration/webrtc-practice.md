---
sidebar_position: 3
title: "WebRTC 深入应用"
difficulty: "hard"
tags: ["WebRTC", "P2P", "音视频", "数据通道"]
---

# WebRTC 深入应用

## WebRTC 架构概览

WebRTC（Web Real-Time Communication）是一组浏览器原生支持的 API，允许网页应用直接进行点对点（P2P）的音视频通话和数据传输，无需安装插件。

### P2P 通信原理

```
传统架构（经过服务器中转）：        WebRTC架构（点对点直连）：
┌────────┐   ┌────────┐   ┌────────┐    ┌────────┐        ┌────────┐
│Client A│──→│ Server │──→│Client B│    │Client A│◄══════►│Client B│
└────────┘   └────────┘   └────────┘    └────────┘  P2P   └────────┘
    延迟 = A→Server + Server→B                延迟 = A→B（更低）
    带宽 = 全部经过服务器                      带宽 = 点对点直传
```

:::info WebRTC 的核心优势
- **低延迟**：P2P 直连，无服务器中转开销
- **高带宽**：利用两端之间的直接链路
- **端到端加密**：SRTP/DTLS 强制加密
- **浏览器原生**：无需安装插件或客户端
:::

### 核心 API

| API | 用途 | 典型场景 |
|-----|------|----------|
| `RTCPeerConnection` | 管理 P2P 连接 | 所有 WebRTC 应用 |
| `MediaStream` | 音视频流获取 | 视频通话、屏幕共享 |
| `RTCDataChannel` | 任意数据传输 | 文件传输、游戏同步 |
| `getUserMedia` | 获取摄像头/麦克风 | 视频通话 |
| `getDisplayMedia` | 获取屏幕画面 | 屏幕共享 |

### ICE 框架

ICE（Interactive Connectivity Establishment）负责在复杂网络环境中建立 P2P 连接：

```
┌─────────────────────────────────────────────────┐
│                  ICE 连接建立流程                  │
├─────────────────────────────────────────────────┤
│                                                   │
│  1. 收集候选地址（Candidate Gathering）            │
│     ├── Host Candidate（本地IP）                  │
│     ├── Server Reflexive（STUN 映射的公网IP）     │
│     └── Relay Candidate（TURN 中继地址）          │
│                                                   │
│  2. 连接检测（Connectivity Check）                │
│     └── 尝试所有候选对，找到可用路径              │
│                                                   │
│  3. 选择最优路径                                  │
│     └── 优先级：Host > ServerReflexive > Relay   │
└─────────────────────────────────────────────────┘
```

**STUN 服务器**：帮助客户端发现自己的公网 IP 和端口（轻量级）

**TURN 服务器**：当 P2P 直连失败时，作为中继转发数据（重量级、需带宽）

:::warning NAT 穿透现实
约 80% 的场景可以通过 STUN 实现 P2P 直连，但企业防火墙、对称型 NAT 等情况下必须依赖 TURN 中继。生产环境必须部署 TURN 服务器作为兜底。
:::

### 信令过程

```
Client A                信令服务器              Client B
   │                       │                       │
   │──── Create Offer ────→│                       │
   │                       │──── Forward Offer ───→│
   │                       │                       │
   │                       │←── Create Answer ─────│
   │←── Forward Answer ────│                       │
   │                       │                       │
   │──── ICE Candidate ───→│──── ICE Candidate ───→│
   │←── ICE Candidate ─────│←── ICE Candidate ─────│
   │                       │                       │
   │◄══════════ P2P 连接建立 ════════════════════►│
```

---

## 信令服务器实现

信令服务器不传输音视频数据，只负责交换连接建立所需的元数据（SDP、ICE Candidate）。

### WebSocket 信令方案

```typescript
// 服务端 — Node.js + ws
import { WebSocketServer, WebSocket } from 'ws';

interface Room {
  clients: Map<string, WebSocket>;
}

const wss = new WebSocketServer({ port: 8080 });
const rooms: Map<string, Room> = new Map();

wss.on('connection', (ws) => {
  let currentRoom: string | null = null;
  let userId: string | null = null;

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    switch (msg.type) {
      case 'join': {
        userId = msg.userId;
        currentRoom = msg.roomId;
        if (!rooms.has(currentRoom)) {
          rooms.set(currentRoom, { clients: new Map() });
        }
        const room = rooms.get(currentRoom)!;
        room.clients.set(userId, ws);

        // 通知房间内其他人
        broadcast(room, userId, {
          type: 'user-joined',
          userId
        });
        break;
      }

      case 'offer':
      case 'answer':
      case 'ice-candidate': {
        // 转发信令消息给目标用户
        const room = rooms.get(currentRoom!);
        const target = room?.clients.get(msg.targetId);
        if (target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify({
            ...msg,
            fromId: userId
          }));
        }
        break;
      }

      case 'leave': {
        handleLeave();
        break;
      }
    }
  });

  ws.on('close', () => handleLeave());

  function handleLeave() {
    if (currentRoom && userId) {
      const room = rooms.get(currentRoom);
      room?.clients.delete(userId);
      broadcast(room!, userId, {
        type: 'user-left',
        userId
      });
    }
  }

  function broadcast(room: Room, excludeId: string, msg: object) {
    room.clients.forEach((client, id) => {
      if (id !== excludeId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(msg));
      }
    });
  }
});
```

---

## 媒体流应用

### getUserMedia — 获取本地媒体

```typescript
// 获取摄像头和麦克风
async function getLocalMedia(): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { max: 30 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });
  return stream;
}

// 获取屏幕共享
async function getScreenMedia(): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: 'always',
      displaySurface: 'monitor'
    },
    audio: true // 系统音频（部分浏览器支持）
  });
  return stream;
}
```

### 视频通话完整实现

```typescript
class VideoCall {
  private pc: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private signalingWs: WebSocket;

  constructor(private config: RTCConfiguration) {
    this.pc = new RTCPeerConnection(config);
    this.signalingWs = new WebSocket('wss://signal.example.com');
    this.setupPeerConnection();
    this.setupSignaling();
  }

  private setupPeerConnection() {
    // 收到远端媒体流
    this.pc.ontrack = (event) => {
      const remoteVideo = document.getElementById('remote') as HTMLVideoElement;
      remoteVideo.srcObject = event.streams[0];
    };

    // ICE 候选产生时发送给对方
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingWs.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          targetId: this.remoteUserId
        }));
      }
    };

    // 连接状态监控
    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc.connectionState);
      if (this.pc.connectionState === 'failed') {
        this.reconnect();
      }
    };
  }

  private setupSignaling() {
    this.signalingWs.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'offer':
          await this.handleOffer(msg);
          break;
        case 'answer':
          await this.pc.setRemoteDescription(msg.sdp);
          break;
        case 'ice-candidate':
          await this.pc.addIceCandidate(msg.candidate);
          break;
      }
    };
  }

  // 发起通话
  async startCall(remoteUserId: string) {
    this.remoteUserId = remoteUserId;
    this.localStream = await getLocalMedia();

    // 添加本地媒体轨道
    this.localStream.getTracks().forEach(track => {
      this.pc.addTrack(track, this.localStream!);
    });

    // 创建并发送 Offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    this.signalingWs.send(JSON.stringify({
      type: 'offer',
      sdp: offer,
      targetId: remoteUserId
    }));
  }

  // 处理收到的 Offer
  private async handleOffer(msg: any) {
    this.localStream = await getLocalMedia();
    this.localStream.getTracks().forEach(track => {
      this.pc.addTrack(track, this.localStream!);
    });

    await this.pc.setRemoteDescription(msg.sdp);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    this.signalingWs.send(JSON.stringify({
      type: 'answer',
      sdp: answer,
      targetId: msg.fromId
    }));
  }

  // 挂断
  hangup() {
    this.localStream?.getTracks().forEach(t => t.stop());
    this.pc.close();
  }

  private remoteUserId: string = '';
  private reconnect() { /* 重连逻辑 */ }
}

// 使用
const call = new VideoCall({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:turn.example.com', username: 'user', credential: 'pass' }
  ]
});
```

---

## 数据通道（RTCDataChannel）

RTCDataChannel 提供了 P2P 的任意数据传输能力，类似 WebSocket 但无需服务器中转。

### 通道模式

| 配置 | 说明 | 适用场景 |
|------|------|----------|
| `ordered: true, reliable: true` | 有序可靠（默认） | 文件传输、聊天消息 |
| `ordered: false, reliable: true` | 无序可靠 | 大文件分片传输 |
| `ordered: true, maxRetransmits: 0` | 有序不可靠 | 实时游戏状态 |
| `ordered: false, maxRetransmits: 0` | 无序不可靠 | 视频帧、位置更新 |

### 文件传输实现

```typescript
class P2PFileTransfer {
  private channel: RTCDataChannel;
  private CHUNK_SIZE = 64 * 1024; // 64KB 分片

  // 发送端
  async sendFile(file: File) {
    // 先发送文件元信息
    this.channel.send(JSON.stringify({
      type: 'file-meta',
      name: file.name,
      size: file.size,
      mimeType: file.type
    }));

    // 分片发送
    const buffer = await file.arrayBuffer();
    let offset = 0;
    while (offset < buffer.byteLength) {
      // 等待缓冲区空闲（背压控制）
      if (this.channel.bufferedAmount > 1024 * 1024) {
        await new Promise(r => setTimeout(r, 50));
        continue;
      }
      const chunk = buffer.slice(offset, offset + this.CHUNK_SIZE);
      this.channel.send(chunk);
      offset += this.CHUNK_SIZE;
    }

    this.channel.send(JSON.stringify({ type: 'file-complete' }));
  }

  // 接收端
  setupReceiver() {
    let fileMeta: any = null;
    const chunks: ArrayBuffer[] = [];

    this.channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);
        if (msg.type === 'file-meta') {
          fileMeta = msg;
          chunks.length = 0;
        } else if (msg.type === 'file-complete') {
          const blob = new Blob(chunks, { type: fileMeta.mimeType });
          downloadFile(blob, fileMeta.name);
        }
      } else {
        chunks.push(event.data);
      }
    };
  }
}
```

### 游戏状态同步

```typescript
// 使用不可靠通道进行高频游戏状态同步
const gameChannel = pc.createDataChannel('game-state', {
  ordered: false,
  maxRetransmits: 0 // 不重传，过时的状态丢弃即可
});

// 以 60fps 发送玩家状态
setInterval(() => {
  gameChannel.send(JSON.stringify({
    timestamp: performance.now(),
    position: { x: player.x, y: player.y },
    velocity: { vx: player.vx, vy: player.vy },
    animation: player.currentAnimation
  }));
}, 16); // ~60fps
```

---

## 屏幕共享实现

```typescript
class ScreenSharing {
  private screenStream: MediaStream | null = null;
  private sender: RTCRtpSender | null = null;

  async startSharing(pc: RTCPeerConnection) {
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { 
        cursor: 'always',
        width: { max: 1920 },
        height: { max: 1080 },
        frameRate: { max: 15 } // 屏幕共享不需要高帧率
      }
    });

    const videoTrack = this.screenStream.getVideoTracks()[0];

    // 替换已有的视频轨道，或添加新轨道
    const existingSender = pc.getSenders().find(
      s => s.track?.kind === 'video'
    );

    if (existingSender) {
      await existingSender.replaceTrack(videoTrack);
    } else {
      this.sender = pc.addTrack(videoTrack, this.screenStream);
    }

    // 用户点击浏览器的"停止共享"按钮时
    videoTrack.onended = () => {
      this.stopSharing(pc);
    };
  }

  async stopSharing(pc: RTCPeerConnection) {
    // 切回摄像头
    const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const cameraTrack = cameraStream.getVideoTracks()[0];
    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
    await sender?.replaceTrack(cameraTrack);
    this.screenStream?.getTracks().forEach(t => t.stop());
  }
}
```

---

## 多人会议架构

### Mesh vs SFU vs MCU

| 架构 | 原理 | 优点 | 缺点 | 适用规模 |
|------|------|------|------|----------|
| **Mesh** | 每两人直连 | 无服务器、延迟低 | 带宽 O(n²)、CPU 重 | 2-4人 |
| **SFU** | 服务器转发（不编解码） | 带宽灵活、质量可控 | 需要服务器 | 5-100人 |
| **MCU** | 服务器混合（编解码） | 客户端带宽最低 | 服务器 CPU 极高、延迟大 | 已淘汰 |

```
Mesh（网状）:          SFU（选择转发）:         MCU（混合编码）:
A ←──→ B              A ──→ ┌─────┐ ──→ B      A ──→ ┌─────┐ ──→ A
│ ╲  ╱ │              B ──→ │ SFU │ ──→ A      B ──→ │ MCU │ ──→ B
│  ╳   │              C ──→ │     │ ──→ C      C ──→ │混合 │ ──→ C
│ ╱  ╲ │                    └─────┘                   └─────┘
C ←──→ D              服务器只转发，               服务器解码+混合+编码
每人发N-1路           每人发1路收N-1路             每人收发各1路
```

### SFU 为什么是主流选择

:::tip SFU 是现代视频会议的标准架构
Zoom、腾讯会议、Google Meet、Discord 都使用 SFU 架构。
:::

SFU 的核心优势：
1. **带宽效率**：每个客户端只上传一路，下载 N-1 路（由服务器控制质量）
2. **灵活质量控制**：Simulcast（同时发送多分辨率）+ SVC（可伸缩编码）
3. **服务器开销低**：只做转发不做编解码，CPU 消耗远低于 MCU
4. **端到端加密可行**：服务器不接触明文媒体数据

---

## 常见问题与优化

### NAT 穿透失败

```typescript
// 完善的 ICE 配置，确保 TURN 兜底
const config: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: ['turn:turn.example.com:3478', 'turns:turn.example.com:5349'],
      username: 'user',
      credential: 'pass'
    }
  ],
  iceTransportPolicy: 'all', // 'relay' 可强制使用 TURN（调试用）
  iceCandidatePoolSize: 5    // 预收集候选，加速连接
};
```

### 带宽自适应

```typescript
// 根据网络状况动态调整视频参数
async function adaptBitrate(pc: RTCPeerConnection) {
  const sender = pc.getSenders().find(s => s.track?.kind === 'video');
  if (!sender) return;

  const params = sender.getParameters();
  if (!params.encodings[0]) return;

  // 获取当前网络统计
  const stats = await pc.getStats(sender);
  let availableBandwidth = Infinity;

  stats.forEach(report => {
    if (report.type === 'candidate-pair' && report.availableOutgoingBitrate) {
      availableBandwidth = report.availableOutgoingBitrate;
    }
  });

  // 根据可用带宽调整
  if (availableBandwidth < 500_000) {
    params.encodings[0].maxBitrate = 300_000;  // 低带宽：300kbps
    params.encodings[0].scaleResolutionDownBy = 4;
  } else if (availableBandwidth < 1_500_000) {
    params.encodings[0].maxBitrate = 1_000_000; // 中等：1Mbps
    params.encodings[0].scaleResolutionDownBy = 2;
  } else {
    params.encodings[0].maxBitrate = 3_000_000; // 高带宽：3Mbps
    params.encodings[0].scaleResolutionDownBy = 1;
  }

  await sender.setParameters(params);
}

// 每 5 秒检测一次
setInterval(() => adaptBitrate(pc), 5000);
```

### 丢包恢复策略

| 策略 | 原理 | 延迟影响 | 适用场景 |
|------|------|----------|----------|
| NACK（重传请求） | 请求重传丢失的包 | +1 RTT | 可靠数据传输 |
| FEC（前向纠错） | 冗余编码恢复丢失数据 | 无额外延迟 | 实时音视频 |
| PLI（关键帧请求） | 请求发送新的关键帧 | 较大延迟 | 视频严重花屏时 |
| Jitter Buffer | 缓冲+重排序 | +20-200ms | 音频播放平滑 |

---

## 面试题

### Q1: WebRTC 建立连接的完整流程是什么？

**参考答案：**

1. **获取本地媒体**：getUserMedia 获取音视频流
2. **创建 PeerConnection**：配置 ICE 服务器
3. **添加媒体轨道**：addTrack 将本地流加入连接
4. **创建 Offer/Answer**：发起方创建 Offer SDP
5. **交换 SDP**：通过信令服务器交换 Offer 和 Answer
6. **ICE 候选收集**：STUN/TURN 获取候选地址
7. **ICE 候选交换**：通过信令服务器交换 ICE Candidate
8. **连接建立**：ICE 找到可用路径后 P2P 连接建立
9. **媒体传输**：SRTP 加密传输音视频数据

### Q2: STUN 和 TURN 的区别？为什么生产环境需要 TURN？

**参考答案：**

- **STUN**：帮助客户端发现自己经过 NAT 映射后的公网地址，是轻量级的"地址发现"服务，不中转数据
- **TURN**：当 P2P 直连失败时作为中继服务器转发所有数据，是重量级的"数据中转"服务

生产环境必须 TURN 的原因：
- 对称型 NAT（常见于企业网络）无法通过 STUN 穿透
- 某些防火墙只允许 443 端口出站
- 约 10-20% 的真实用户无法 P2P 直连
- 没有 TURN 兜底意味着这些用户完全无法通话

### Q3: 如何优化 WebRTC 视频通话的质量？

**参考答案：**

1. **Simulcast**：同时发送多分辨率流，接收端按需选择
2. **带宽自适应（BWE）**：实时监测网络状况调整码率
3. **关键帧请求策略**：智能触发 PLI，避免长时间花屏
4. **Jitter Buffer 优化**：动态调整缓冲大小平衡延迟和流畅度
5. **硬件加速编解码**：优先使用 H.264 硬编码
6. **网络切换处理**：ICE Restart 实现无缝切换 WiFi/4G

### Q4: RTCDataChannel 和 WebSocket 的区别？各自适合什么场景？

**参考答案：**

| 维度 | RTCDataChannel | WebSocket |
|------|----------------|-----------|
| 传输方式 | P2P 直连 | 经过服务器 |
| 延迟 | 极低（~10ms） | 低（~50ms） |
| 可靠性 | 可配置（可靠/不可靠） | 始终可靠 |
| 加密 | DTLS（强制） | TLS（可选） |
| NAT 穿透 | 需要 ICE | 无此问题 |
| 服务器成本 | 低（不经过服务器） | 高（所有数据经过） |

- DataChannel 适合：游戏同步、文件传输、低延迟协作
- WebSocket 适合：聊天、通知、需要服务端逻辑的场景

### Q5: 在一个 100 人的视频会议中，为什么不能使用 Mesh 架构？

**参考答案：**

Mesh 架构中每个参与者需要与其他所有人建立独立连接：
- **连接数**：N×(N-1)/2 = 4950 条连接
- **上行带宽**：每人发送 99 路视频流（假设 1Mbps/路 = 99Mbps，完全不可行）
- **CPU 负载**：每个客户端需要编码 99 次

而 SFU 架构下：
- 每人只上传 1 路，下载由服务器控制（可以只转发活跃说话者的高清流）
- 服务器只做转发不做编解码，成本可控
- 支持 Simulcast，弱网用户可以收到低分辨率流
