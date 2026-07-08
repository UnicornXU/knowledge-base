---
sidebar_position: 4
title: WebAssembly 前端应用场景
difficulty: medium
tags:
  - wasm
  - image-processing
  - video-codec
  - game-engine
  - cryptography
---

# 🎯 WebAssembly 前端应用场景

> **"不是所有场景都需要 WASM，但在对的场景下，WASM 带来的提升是数量级的"** —— 关键是识别计算密集型任务并合理使用 WASM。

## 一、WASM 适用场景判断

```
是否应该使用 WASM？决策树
═══════════════════════════════════════════════════════════════
  你的任务是什么？
  │
  ├─► DOM 操作 / UI 交互
  │   └─► ❌ 不需要 WASM，JS 更合适
  │
  ├─► 计算密集型任务
  │   ├─► 需要大量数值计算？
  │   │   └─► ✅ 使用 WASM
  │   ├─► 需要处理大量二进制数据？
  │   │   └─► ✅ 使用 WASM
  │   └─► 简单的数据转换？
  │       └─► 🤔 评估性能差距是否值得引入 WASM
  │
  ├─► 需要复用已有 C/C++/Rust 代码？
  │   └─► ✅ 使用 WASM（避免重写）
  │
  └─► 需要确定性的执行性能？
      └─► ✅ 使用 WASM（无 JIT 去优化）
═══════════════════════════════════════════════════════════════
```

## 二、场景一：图片处理

### 2.1 架构设计

```
图片处理管线（WASM 加速）
═══════════════════════════════════════════════════════════════
  ┌──────────┐    ┌──────────┐    ┌──────────────┐
  │ Canvas   │    │ 获取      │    │  传入 WASM   │
  │ 图片加载  │───►│ ImageData │───►│  像素数据     │
  └──────────┘    └──────────┘    └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │  WASM 处理    │
                                  │  灰度/滤镜/   │
                                  │  边缘检测/    │
                                  │  高斯模糊     │
                                  └──────┬───────┘
                                         │
                                         ▼
  ┌──────────┐    ┌──────────┐    ┌──────────────┐
  │ 显示结果  │◄───│ 写回      │◄───│  返回处理后   │
  │          │    │ Canvas    │    │  像素数据     │
  └──────────┘    └──────────┘    └──────────────┘
═══════════════════════════════════════════════════════════════
```

### 2.2 Rust 实现：图像滤镜

```rust
use wasm_bindgen::prelude::*;

/// 灰度滤镜
#[wasm_bindgen]
pub fn grayscale(data: &mut [u8], width: u32, height: u32) {
    let len = (width * height * 4) as usize;
    for i in (0..len).step_by(4) {
        let r = data[i] as f32;
        let g = data[i + 1] as f32;
        let b = data[i + 2] as f32;
        let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }
}

/// 高斯模糊（3x3 核）
#[wasm_bindgen]
pub fn gaussian_blur(data: &mut [u8], width: u32, height: u32) {
    let w = width as usize;
    let h = height as usize;
    let mut output = vec![0u8; data.len()];

    // 3x3 高斯核
    let kernel: [f32; 9] = [
        1.0/16.0, 2.0/16.0, 1.0/16.0,
        2.0/16.0, 4.0/16.0, 2.0/16.0,
        1.0/16.0, 2.0/16.0, 1.0/16.0,
    ];

    for y in 1..h-1 {
        for x in 1..w-1 {
            for c in 0..3 { // RGB 三个通道
                let mut sum = 0.0f32;
                for ky in 0..3usize {
                    for kx in 0..3usize {
                        let px = (x + kx - 1) as usize;
                        let py = (y + ky - 1) as usize;
                        let idx = (py * w + px) * 4 + c;
                        sum += data[idx] as f32 * kernel[ky * 3 + kx];
                    }
                }
                output[(y * w + x) * 4 + c] = sum.clamp(0.0, 255.0) as u8;
            }
            output[(y * w + x) * 4 + 3] = data[(y * w + x) * 4 + 3]; // alpha
        }
    }
    data.copy_from_slice(&output);
}

/// 边缘检测（Sobel 算子）
#[wasm_bindgen]
pub fn sobel_edge_detection(data: &mut [u8], width: u32, height: u32) {
    let w = width as usize;
    let h = height as usize;
    let mut gray = vec![0f32; w * h];

    // 先转灰度
    for i in 0..w*h {
        let r = data[i*4] as f32;
        let g = data[i*4+1] as f32;
        let b = data[i*4+2] as f32;
        gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Sobel 算子
    let gx: [f32; 9] = [-1.0, 0.0, 1.0, -2.0, 0.0, 2.0, -1.0, 0.0, 1.0];
    let gy: [f32; 9] = [-1.0, -2.0, -1.0, 0.0, 0.0, 0.0, 1.0, 2.0, 1.0];

    for y in 1..h-1 {
        for x in 1..w-1 {
            let mut sx = 0.0f32;
            let mut sy = 0.0f32;
            for ky in 0..3usize {
                for kx in 0..3usize {
                    let val = gray[(y+ky-1) * w + (x+kx-1)];
                    sx += val * gx[ky*3+kx];
                    sy += val * gy[ky*3+kx];
                }
            }
            let magnitude = (sx*sx + sy*sy).sqrt().min(255.0) as u8;
            let idx = (y * w + x) * 4;
            data[idx] = magnitude;
            data[idx+1] = magnitude;
            data[idx+2] = magnitude;
        }
    }
}
```

### 2.3 JS 端集成

```javascript
async function applyFilter(imageElement, filterType) {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // 性能对比
  console.time('WASM');
  switch (filterType) {
    case 'grayscale':
      grayscale(data, canvas.width, canvas.height);
      break;
    case 'blur':
      gaussian_blur(data, canvas.width, canvas.height);
      break;
    case 'edge':
      sobel_edge_detection(data, canvas.width, canvas.height);
      break;
  }
  console.timeEnd('WASM');

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
```

### 2.4 性能对比

```
图片处理性能对比（1920x1080 图片）
═══════════════════════════════════════════════════════════════
  滤镜          JavaScript    WebAssembly    提升倍数
  ─────────────────────────────────────────────────────────────
  灰度          ~12ms         ~2ms           6x
  高斯模糊      ~45ms         ~8ms           5.6x
  边缘检测      ~38ms         ~6ms           6.3x
  SIFT 特征     ~800ms        ~120ms         6.7x
═══════════════════════════════════════════════════════════════
```

## 三、场景二：音视频编解码

### 3.1 架构设计

```
视频解码管线（WASM）
═══════════════════════════════════════════════════════════════
  ┌──────────┐    ┌──────────────┐    ┌──────────────┐
  │ 视频流    │───►│ WASM 解码器   │───►│ YUV → RGB    │
  │ (H.264)  │    │ (FFmpeg)     │    │ 色彩空间转换   │
  └──────────┘    └──────────────┘    └──────┬───────┘
                                             │
                                             ▼
  ┌──────────┐    ┌──────────────┐    ┌──────────────┐
  │ 播放器    │◄───│ 渲染到       │◄───│ ImageData    │
  │ 显示      │    │ Canvas       │    │ 像素数据     │
  └──────────┘    └──────────────┘    └──────────────┘
═══════════════════════════════════════════════════════════════
```

### 3.2 FFmpeg WASM 示例

```javascript
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });
await ffmpeg.load();

// 视频转码
ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(inputFile));
await ffmpeg.run('-i', 'input.mp4', '-vf', 'scale=640:480', 'output.mp4');
const data = ffmpeg.FS('readFile', 'output.mp4');

// 音频提取
await ffmpeg.run('-i', 'input.mp4', '-vn', '-acodec', 'pcm_s16le', 'output.wav');

// 视频截帧
await ffmpeg.run('-i', 'input.mp4', '-vf', 'fps=1', 'frame_%03d.png');
```

### 3.3 自定义音频解码器

```rust
use wasm_bindgen::prelude::*;

/// Opus 音频解码器（简化示例）
#[wasm_bindgen]
pub struct OpusDecoder {
    sample_rate: u32,
    channels: u32,
    state: Vec<f32>, // 简化的解码状态
}

#[wasm_bindgen]
impl OpusDecoder {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: u32, channels: u32) -> OpusDecoder {
        OpusDecoder {
            sample_rate,
            channels,
            state: vec![0.0; 960 * channels as usize],
        }
    }

    /// 解码一帧 Opus 数据为 PCM
    pub fn decode(&mut self, opus_data: &[u8]) -> Vec<f32> {
        // 实际实现需要调用 opus 解码库
        // 这里返回 PCM 采样数据
        let frame_size = 960; // 20ms at 48kHz
        let mut pcm = vec![0.0f32; frame_size * self.channels as usize];

        // ... 解码逻辑 ...

        pcm
    }
}
```

## 四、场景三：游戏引擎

### 4.1 架构设计

```
WASM 游戏引擎架构
═══════════════════════════════════════════════════════════════
  ┌─────────────────────────────────────────────────────────┐
  │                     游戏主循环                           │
  │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌────────┐ │
  │  │ 输入处理 │──►│ 物理引擎 │──►│ 渲染引擎 │──►│ 音频    │ │
  │  │ (JS)    │   │ (WASM)  │   │ (WASM)  │   │ (WASM) │ │
  │  └─────────┘   └─────────┘   └─────────┘   └────────┘ │
  └─────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
  │ DOM     │   │ WebGL   │   │ WebGL   │   │ Web     │
  │ Events  │   │ 碰撞检测 │   │ 绘制调用 │   │ Audio   │
  └─────────┘   └─────────┘   └─────────┘   └─────────┘
═══════════════════════════════════════════════════════════════
```

### 4.2 物理引擎示例

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Vec2 {
    pub x: f32,
    pub y: f32,
}

#[wasm_bindgen]
pub struct PhysicsWorld {
    bodies: Vec<RigidBody>,
    gravity: Vec2,
}

#[wasm_bindgen]
struct RigidBody {
    position: Vec2,
    velocity: Vec2,
    mass: f32,
    restitution: f32,
}

#[wasm_bindgen]
impl PhysicsWorld {
    #[wasm_bindgen(constructor)]
    pub fn new(gravity_x: f32, gravity_y: f32) -> PhysicsWorld {
        PhysicsWorld {
            bodies: Vec::new(),
            gravity: Vec2 { x: gravity_x, y: gravity_y },
        }
    }

    pub fn add_body(&mut self, x: f32, y: f32, mass: f32, restitution: f32) -> usize {
        self.bodies.push(RigidBody {
            position: Vec2 { x, y },
            velocity: Vec2 { x: 0.0, y: 0.0 },
            mass,
            restitution,
        });
        self.bodies.len() - 1
    }

    /// 物理模拟步进
    pub fn step(&mut self, dt: f32) {
        // 应用重力
        for body in &mut self.bodies {
            body.velocity.x += self.gravity.x * dt;
            body.velocity.y += self.gravity.y * dt;
            body.position.x += body.velocity.x * dt;
            body.position.y += body.velocity.y * dt;
        }

        // 碰撞检测和响应
        self.resolve_collisions();
    }

    fn resolve_collisions(&mut self) {
        let len = self.bodies.len();
        for i in 0..len {
            for j in (i+1)..len {
                // 简化的碰撞检测
                let dx = self.bodies[j].position.x - self.bodies[i].position.x;
                let dy = self.bodies[j].position.y - self.bodies[i].position.y;
                let dist_sq = dx * dx + dy * dy;
                let min_dist = 20.0; // 假设半径为 10

                if dist_sq < min_dist * min_dist {
                    // 简化的弹性碰撞响应
                    let temp_vx = self.bodies[i].velocity.x;
                    let temp_vy = self.bodies[i].velocity.y;
                    self.bodies[i].velocity.x = self.bodies[j].velocity.x * self.bodies[i].restitution;
                    self.bodies[i].velocity.y = self.bodies[j].velocity.y * self.bodies[i].restitution;
                    self.bodies[j].velocity.x = temp_vx * self.bodies[j].restitution;
                    self.bodies[j].velocity.y = temp_vy * self.bodies[j].restitution;
                }
            }
        }
    }

    /// 获取所有物体的位置（批量返回，减少边界调用）
    pub fn get_positions(&self) -> Vec<f32> {
        let mut positions = Vec::with_capacity(self.bodies.len() * 2);
        for body in &self.bodies {
            positions.push(body.position.x);
            positions.push(body.position.y);
        }
        positions
    }
}
```

## 五、场景四：加密计算

### 5.1 架构设计

```
WASM 加密计算场景
═══════════════════════════════════════════════════════════════
  场景                    为什么用 WASM
  ─────────────────────────────────────────────────────────────
  密码哈希 (bcrypt/       计算密集，纯 JS 太慢
    argon2/scrypt)

  端到端加密              性能关键，需要快速加解密
  (AES/ChaCha20)

  零知识证明              纯数学计算，WASM 优势明显
  (zk-SNARKs)

  TLS/SSL 处理            复杂加密算法，需要原生性能

  浏览器挖矿/区块链        大量哈希计算
═══════════════════════════════════════════════════════════════
```

### 5.2 Argon2 密码哈希示例

```rust
use wasm_bindgen::prelude::*;
use argon2::{Argon2, Version, Params, Algorithm};

#[wasm_bindgen]
pub fn hash_password(password: &[u8], salt: &[u8]) -> Result<Vec<u8>, JsValue> {
    let params = Params::new(65536, 3, 1, None)
        .map_err(|e| JsValue::from_str(&format!("参数错误: {:?}", e)))?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut output = vec![0u8; 32];

    argon2.hash_password_into(password, salt, &mut output)
        .map_err(|e| JsValue::from_str(&format!("哈希失败: {:?}", e)))?;

    Ok(output)
}
```

```javascript
// JS 端使用
import init, { hash_password } from './pkg/crypto_wasm.js';

await init();

const password = new TextEncoder().encode('my_secure_password');
const salt = crypto.getRandomValues(new Uint8Array(16));

console.time('Argon2 WASM');
const hash = hash_password(password, salt);
console.timeEnd('Argon2 WASM'); // ~200ms (vs ~2000ms 纯 JS)

console.log('Hash:', Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join(''));
```

### 5.3 AES 加密示例

```rust
use wasm_bindgen::prelude::*;
use aes::Aes256;
use aes::cipher::{BlockEncrypt, BlockDecrypt, KeyInit};
use aes::cipher::generic_array::GenericArray;

#[wasm_bindgen]
pub struct AesCipher {
    cipher: Aes256,
}

#[wasm_bindgen]
impl AesCipher {
    #[wasm_bindgen(constructor)]
    pub fn new(key: &[u8]) -> Result<AesCipher, JsValue> {
        if key.len() != 32 {
            return Err(JsValue::from_str("密钥必须是 32 字节"));
        }
        let cipher = Aes256::new(GenericArray::from_slice(key));
        Ok(AesCipher { cipher })
    }

    /// 加密数据（ECB 模式简化示例）
    pub fn encrypt(&self, data: &[u8]) -> Vec<u8> {
        let mut padded = data.to_vec();
        // PKCS7 padding
        let padding_len = 16 - (padded.len() % 16);
        padded.extend(std::iter::repeat(padding_len as u8).take(padding_len));

        let mut result = vec![0u8; padded.len()];
        for (i, chunk) in padded.chunks(16).enumerate() {
            let mut block = GenericArray::clone_from_slice(chunk);
            self.cipher.encrypt_block(&mut block);
            result[i*16..(i+1)*16].copy_from_slice(&block);
        }
        result
    }

    /// 解密数据
    pub fn decrypt(&self, data: &[u8]) -> Result<Vec<u8>, JsValue> {
        if data.len() % 16 != 0 {
            return Err(JsValue::from_str("数据长度必须是 16 的倍数"));
        }

        let mut result = vec![0u8; data.len()];
        for (i, chunk) in data.chunks(16).enumerate() {
            let mut block = GenericArray::clone_from_slice(chunk);
            self.cipher.decrypt_block(&mut block);
            result[i*16..(i+1)*16].copy_from_slice(&block);
        }

        // 去除 PKCS7 padding
        if let Some(&last) = result.last() {
            let padding_len = last as usize;
            if padding_len > 0 && padding_len <= 16 {
                result.truncate(result.len() - padding_len);
            }
        }

        Ok(result)
    }
}
```

## 六、其他应用场景

### 6.1 WebAR / 计算机视觉

```
WebAR 处理管线
═══════════════════════════════════════════════════════════════
  摄像头帧 → WASM (特征检测/SLAM) → 3D 渲染 (Three.js)
             │
             ├─► ORB 特征提取
             ├─► 平面检测
             └─► 姿态估计
═══════════════════════════════════════════════════════════════
```

### 6.2 PDF / 文档解析

```javascript
// 使用 pdfium WASM 解析 PDF
import pdfium from 'pdfium-wasm';

const doc = await pdfium.loadDocument(pdfBuffer);
const page = doc.getPage(0);
const text = page.extractText();
const bitmap = page.renderToBitmap(72); // 72 DPI
```

### 6.3 SQL 查询引擎

```javascript
// 使用 sql.js（SQLite WASM 版本）
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();
const db = new SQL.Database();

db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)");
db.run("INSERT INTO users VALUES (1, 'Alice', 30)");
db.run("INSERT INTO users VALUES (2, 'Bob', 25)");

const results = db.exec("SELECT * FROM users WHERE age > 20");
console.log(results);
```

## 七、性能对比总结

```
各场景 WASM vs JS 性能对比
═══════════════════════════════════════════════════════════════
  场景                  JS 耗时     WASM 耗时    提升
  ─────────────────────────────────────────────────────────────
  图片灰度 (4K)         ~45ms       ~8ms         5.6x
  高斯模糊 (1080p)      ~120ms      ~20ms        6x
  视频解码 (H.264)       N/A         ~16ms/帧     -
  物理模拟 (1000物体)    ~8ms        ~1.5ms       5.3x
  Argon2 哈希           ~2000ms     ~200ms       10x
  AES-256 加密          ~150ms      ~25ms        6x
  SQLite 查询           ~50ms       ~12ms        4.2x
  PDF 渲染              ~300ms      ~80ms        3.8x
═══════════════════════════════════════════════════════════════
```

## 八、面试要点

### 8.1 常见面试问题

**Q1：什么场景下应该使用 WASM？**

> 计算密集型任务（图像处理、音视频编解码、物理模拟、加密计算）、需要复用已有的 C/C++/Rust 代码库、需要确定性执行性能（无 JIT 去优化）的场景。DOM 操作和 UI 交互仍然应该用 JS。

**Q2：WASM 图片处理的架构是什么？**

> Canvas 加载图片 → getImageData 获取像素 → 将像素数据传入 WASM（通过共享内存，零拷贝）→ WASM 端处理像素 → 返回处理后的数据 → putImageData 写回 Canvas。

**Q3：为什么加密计算适合用 WASM？**

> 加密算法（bcrypt、Argon2、AES）是纯计算密集型任务，不涉及 DOM 操作。JS 实现这些算法性能较差，而 WASM 可以达到接近原生的速度。Argon2 在 WASM 中比纯 JS 快约 10 倍。

**Q4：WASM 在游戏引擎中主要负责什么？**

> 物理引擎（碰撞检测、刚体模拟）、AI 逻辑（寻路、决策树）、音频处理、资源管理等计算密集部分。渲染仍然通过 WebGL/WebGPU API 完成（由 JS 调用），输入处理也在 JS 端。

**Q5：使用 WASM 有哪些注意事项？**

> (1) 不要过度使用——简单任务用 JS 即可，引入 WASM 增加复杂度；(2) 注意边界调用开销——批量传入数据比频繁调用高效；(3) 产物体积——WASM + JS 胶水代码可能比纯 JS 大；(4) 调试困难——WASM 调试工具不如 JS 成熟。
