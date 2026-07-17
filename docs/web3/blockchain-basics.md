---
sidebar_position: 2
title: '区块链基础概念'
difficulty: 'medium'
tags: ['blockchain', '智能合约', '共识机制', 'Gas']
---

# 区块链基础概念

## 区块链是什么？

区块链本质上是一个**分布式的、不可篡改的数据库**。它将数据打包成「区块」，按时间顺序链接成「链」，并由全网多个节点共同维护。

对前端开发者来说，区块链可以理解为一个「全球共享的后端数据库」：

- **分布式账本**：数据存储在全球数千个节点上，没有单点故障
- **不可篡改**：一旦写入就无法修改（通过密码学保证）
- **去中心化**：没有中心化管理员，规则由代码执行
- **透明公开**：所有交易记录对所有人可见

:::info 类比理解
把区块链想象成一个「所有人都能看到的 Google Docs」，但没有人能删除或修改历史内容，每次修改都会留下永久记录。
:::

## 区块结构详解

每个区块由以下部分组成：

```
┌──────────────────────────────────────┐
│            区块头 (Block Header)       │
│  ┌──────────────────────────────────┐│
│  │ 前一个区块的哈希 (parentHash)      ││
│  │ 时间戳 (timestamp)                ││
│  │ 区块号 (blockNumber)              ││
│  │ 状态根 (stateRoot)                ││
│  │ 交易根 (transactionsRoot)         ││
│  │ 收据根 (receiptsRoot)             ││
│  │ 难度/验证者信息                    ││
│  └──────────────────────────────────┘│
├──────────────────────────────────────┤
│            交易列表 (Transactions)     │
│  [tx1, tx2, tx3, ... txN]            │
└──────────────────────────────────────┘
```

### Merkle 树

交易通过 Merkle 树组织，支持高效验证：

```javascript
// Merkle 树结构示意
//         Root Hash
//        /         \
//     H(AB)       H(CD)
//    /    \      /    \
//  H(A)  H(B) H(C)  H(D)
//   |     |    |     |
//  TxA   TxB  TxC   TxD

// 验证某笔交易是否存在，只需 O(log n) 的证明
```

### 哈希链接

每个区块通过 `parentHash` 指向前一个区块，形成不可篡改的链：

```javascript
// 如果篡改了区块 #100 中的交易
// → 区块 #100 的哈希变化
// → 区块 #101 的 parentHash 不匹配
// → 所有后续区块都失效
// → 需要重新计算所有后续区块（计算上不可行）
```

## 共识机制对比

| 特性      | PoW（工作量证明） | PoS（权益证明）    | DPoS（委托权益证明） |
| --------- | ----------------- | ------------------ | -------------------- |
| 原理      | 算力竞争出块      | 质押代币获得出块权 | 投票选出代表节点     |
| 安全性    | ⭐⭐⭐⭐⭐        | ⭐⭐⭐⭐           | ⭐⭐⭐               |
| 去中心化  | ⭐⭐⭐⭐⭐        | ⭐⭐⭐⭐           | ⭐⭐⭐               |
| 性能(TPS) | 低(7-15)          | 中(15-100)         | 高(1000+)            |
| 能源消耗  | 极高              | 极低               | 极低                 |
| 典型项目  | Bitcoin           | Ethereum 2.0       | EOS、TRON            |
| 最终确认  | 概率性(6区块)     | 确定性(2 epoch)    | 确定性(秒级)         |

:::warning 注意
以太坊已于 2022 年 9 月完成从 PoW 到 PoS 的转换（The Merge）。现在 Ethereum 是 PoS 共识。
:::

## 智能合约

### 什么是智能合约？

智能合约是部署在区块链上的**自动执行程序**。一旦部署，代码不可修改，任何人都可以调用，执行结果由所有节点验证。

对前端开发者来说，智能合约就像一个**没有后端服务器的 API**——它的逻辑是公开透明的，执行是确定性的。

### EVM（以太坊虚拟机）

EVM 是智能合约的执行环境：

```
前端调用 → RPC 节点 → EVM 执行合约代码 → 状态更新 → 返回结果

执行特点：
- 确定性：相同输入一定产生相同输出
- 隔离性：合约运行在沙箱中
- 计量性：每步操作都消耗 Gas
```

### Solidity 基础示例

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title 简单的代币合约
contract SimpleToken {
    // 状态变量（存储在区块链上）
    string public name = "MyToken";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    // 地址到余额的映射
    mapping(address => uint256) public balanceOf;

    // 事件（前端可以监听）
    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10 ** decimals;
        balanceOf[msg.sender] = totalSupply;
    }

    /// @notice 转账函数
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }
}
```

### 合约部署流程

```mermaid
graph LR
    A[编写 Solidity] --> B[编译为字节码]
    B --> C[构造部署交易]
    C --> D[签名并广播]
    D --> E[矿工打包]
    E --> F[获得合约地址]
```

:::tip 前端开发者须知
你不需要自己部署合约！大部分时候你只需要合约的 **ABI**（接口描述）和**地址**就能与之交互。ABI 就像 TypeScript 的类型定义，告诉前端合约有哪些方法可以调用。
:::

## Gas 机制详解

### Gas 是什么？

Gas 是衡量以太坊上计算量的单位。每个操作都有固定的 Gas 消耗：

| 操作              | Gas 消耗  | 说明             |
| ----------------- | --------- | ---------------- |
| 加法 (ADD)        | 3         | 最基础的算术操作 |
| 存储写入 (SSTORE) | 20,000    | 写入新值到存储   |
| 存储读取 (SLOAD)  | 2,100     | 读取存储值       |
| ETH 转账          | 21,000    | 最基本的转账     |
| ERC-20 转账       | ~65,000   | 涉及合约调用     |
| Uniswap 兑换      | ~150,000  | 复杂 DeFi 操作   |
| NFT 铸造          | ~100,000+ | 写入较多数据     |

### Gas Price vs Gas Limit

```javascript
// 交易费用 = Gas Used × Gas Price
//
// Gas Limit: 你愿意为这笔交易支付的最大 Gas 量
//            - 设太低 → 交易失败（Out of Gas），但 Gas 费不退
//            - 设太高 → 多余的会退回
//
// Gas Price: 每单位 Gas 的价格（单位：Gwei，1 Gwei = 10^-9 ETH）
//            - 设太低 → 交易长时间 pending
//            - 设太高 → 交易快速确认，但费用高

// 示例计算
const gasUsed = 21000n; // 简单 ETH 转账
const gasPrice = 30n; // 30 Gwei
const txFee = gasUsed * gasPrice; // 630,000 Gwei = 0.00063 ETH
```

### EIP-1559 费用机制

EIP-1559 是 2021 年引入的新费用模型：

```javascript
// 新模型: 交易费 = Gas Used × (Base Fee + Priority Fee)
//
// Base Fee: 由网络自动调整，会被销毁（burn）
//           - 区块使用率 > 50% → Base Fee 上升
//           - 区块使用率 < 50% → Base Fee 下降
//
// Priority Fee (Tip): 给验证者的小费，激励优先打包
//
// Max Fee: 用户设置的费用上限

const baseFee = 20n; // 网络自动设定（Gwei）
const priorityFee = 2n; // 你设的小费（Gwei）
const maxFee = 30n; // 你的费用上限（Gwei）

// 实际花费 = Gas Used × (baseFee + priorityFee)
// 退款 = Gas Used × (maxFee - baseFee - priorityFee)
```

### 优化 Gas 的前端策略

```javascript
// 1. 估算 Gas（发送前预判费用）
const gasEstimate = await contract.transfer.estimateGas(to, amount);

// 2. 获取当前 Gas Price
const feeData = await provider.getFeeData();
console.log('Base Fee:', feeData.lastBaseFeePerGas);
console.log('Max Priority Fee:', feeData.maxPriorityFeePerGas);

// 3. 让用户选择速度
const speeds = {
  slow: {maxPriorityFeePerGas: 1_000_000_000n}, // 1 Gwei
  normal: {maxPriorityFeePerGas: 2_000_000_000n}, // 2 Gwei
  fast: {maxPriorityFeePerGas: 5_000_000_000n}, // 5 Gwei
};
```

## 账户模型

以太坊有两种账户类型：

| 特性         | EOA（外部账户）   | 合约账户          |
| ------------ | ----------------- | ----------------- |
| 控制方式     | 私钥              | 合约代码          |
| 能否发起交易 | ✅ 可以           | ❌ 只能被调用     |
| 有无代码     | ❌ 无             | ✅ 有             |
| 创建方式     | 生成密钥对        | 部署合约交易      |
| 地址格式     | 0x + 40位十六进制 | 0x + 40位十六进制 |
| 前端场景     | 用户钱包地址      | 合约交互地址      |

```javascript
// 判断地址是 EOA 还是合约
const code = await provider.getCode(address);
const isContract = code !== '0x'; // 合约地址有代码，EOA 没有
```

## 交易生命周期

```
用户操作 → 构建交易 → 钱包签名 → 广播到网络 → 进入交易池
                                                    ↓
                                              验证者打包
                                                    ↓
用户看到确认 ← 前端监听 ← 区块确认 ← 区块产生 ← 执行交易
```

### 前端需要处理的每个阶段

```javascript
async function sendTransaction() {
  try {
    // 1. 构建并发送交易
    const tx = await contract.transfer(to, amount);
    console.log('交易已提交:', tx.hash);
    // 状态: pending（等待确认）

    // 2. 等待交易被打包进区块
    const receipt = await tx.wait(1); // 等待 1 个区块确认
    console.log('交易已确认:', receipt.blockNumber);
    // 状态: confirmed

    // 3. 对于重要交易，可等待更多确认
    await tx.wait(3); // 等待 3 个确认（更安全）
  } catch (error) {
    if (error.code === 'ACTION_REJECTED') {
      // 用户拒绝签名
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      // 余额不足
    } else if (error.code === 'TRANSACTION_REPLACED') {
      // 交易被替换（加速或取消）
    }
  }
}
```

:::warning 重要提示
交易一旦发送就无法「撤销」。用户在钱包中看到的「加速」或「取消」其实是发送一笔相同 nonce、更高 Gas 的新交易来替换原交易。前端应该在发送前充分告知用户交易内容。
:::

## 面试常见问题

### 1. 区块链为什么不可篡改？

每个区块包含前一个区块的哈希值。如果修改了某个区块的数据，该区块的哈希会变化，导致后续所有区块的引用失效。攻击者需要同时重新计算所有后续区块（在 PoS 中则需要控制 2/3 以上的质押量），这在计算和经济上都不可行。

### 2. 什么是 Nonce？前端为什么要关注？

Nonce 是账户发送交易的序号（从 0 开始递增）。它保证交易按顺序执行且不被重放。前端需要关注的场景：当用户快速发起多笔交易时，可能出现 nonce 冲突，需要正确处理队列。

### 3. 为什么有时候交易很久不确认？

Gas Price/Priority Fee 设置过低，验证者优先打包出价高的交易。解决方案是前端应该根据网络拥堵情况推荐合理的 Gas 设置，并提供「加速交易」功能。

### 4. ERC-20 和 ERC-721 有什么区别？

ERC-20 是同质化代币标准（每个代币相同，可分割），ERC-721 是非同质化代币标准（每个代币唯一，不可分割）。前者用于 DeFi 代币，后者用于 NFT。

### 5. 什么是区块确认数？为什么不同操作需要不同确认数？

区块确认数是交易所在区块之后又产生了多少个新区块。确认数越多，交易被回滚的概率越低。小额操作 1 个确认即可，大额操作通常要求 12+ 个确认。
