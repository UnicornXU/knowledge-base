---
sidebar_position: 4
title: "ethers.js 实战指南"
difficulty: "hard"
tags: ["ethers.js", "智能合约", "Provider", "Signer"]
---

# ethers.js 实战指南

## 为什么选 ethers.js？

ethers.js 是目前最流行的以太坊 JavaScript 库。与老牌的 web3.js 相比：

| 特性 | ethers.js | web3.js |
|------|-----------|---------|
| 包大小 | ~120KB（压缩后） | ~590KB |
| API 设计 | Provider/Signer 分离，职责清晰 | 单一 web3 实例 |
| TypeScript | 原生支持，类型完善 | 后期添加，体验一般 |
| 密钥管理 | Signer 抽象，更安全 | 需手动管理 |
| 文档质量 | 优秀，示例丰富 | 较旧，更新慢 |
| 维护状态 | 活跃（v6 最新） | 活跃但API不稳定 |
| 社区使用 | 主流选择 | 老项目较多 |

:::tip 版本说明
本文基于 ethers.js v6。v6 相比 v5 有较大变化（BigInt 替代 BigNumber，命名空间调整），注意区分。
:::

## 核心概念

ethers.js 有三个核心抽象：

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Provider   │     │   Signer    │     │  Contract   │
│  (只读连接)  │     │  (有签名能力) │     │  (合约交互)  │
│             │     │             │     │             │
│ 查询余额     │     │ 发送交易     │     │ 调用方法     │
│ 读取区块     │     │ 签名消息     │     │ 监听事件     │
│ 获取交易     │     │ 部署合约     │     │ 估算 Gas    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Provider 详解

Provider 是与区块链的只读连接，不涉及私钥和签名。

### 创建 Provider

```javascript
import { JsonRpcProvider, BrowserProvider, InfuraProvider } from 'ethers';

// 1. 连接到远程 RPC 节点
const rpcProvider = new JsonRpcProvider('https://eth.llamarpc.com');

// 2. 连接到浏览器钱包（MetaMask）
const browserProvider = new BrowserProvider(window.ethereum);

// 3. 使用 Infura 服务（内置负载均衡）
const infuraProvider = new InfuraProvider('mainnet', 'YOUR_API_KEY');

// 4. 连接本地开发节点（Hardhat/Anvil）
const localProvider = new JsonRpcProvider('http://127.0.0.1:8545');
```

### 查询区块链数据

```javascript
// 查询余额
const balance = await provider.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f...');
console.log(`余额: ${formatEther(balance)} ETH`); // "1.5 ETH"

// 获取当前区块号
const blockNumber = await provider.getBlockNumber();

// 获取区块详情
const block = await provider.getBlock(blockNumber);
console.log(`时间戳: ${block.timestamp}`);
console.log(`交易数: ${block.transactions.length}`);

// 查询交易详情
const tx = await provider.getTransaction('0x..交易哈希..');
console.log(`发送者: ${tx.from}`);
console.log(`接收者: ${tx.to}`);
console.log(`金额: ${formatEther(tx.value)} ETH`);

// 查询交易收据（确认状态）
const receipt = await provider.getTransactionReceipt('0x...');
console.log(`状态: ${receipt.status === 1 ? '成功' : '失败'}`);
console.log(`Gas 消耗: ${receipt.gasUsed}`);

// 获取 Gas 价格信息
const feeData = await provider.getFeeData();
console.log(`Base Fee: ${formatUnits(feeData.lastBaseFeePerGas, 'gwei')} Gwei`);
```

## Signer 详解

Signer 具有签名能力，可以发送交易和签名消息。

### 获取 Signer

```javascript
import { BrowserProvider, Wallet } from 'ethers';

// 从浏览器钱包获取（常用）
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();

// 从私钥创建（仅用于开发/测试！）
const privateKey = '0xac0974bec...'; // 绝不在前端硬编码真实私钥！
const wallet = new Wallet(privateKey, provider);
```

### 发送 ETH 转账

```javascript
async function sendETH(to, amountInEther) {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const tx = await signer.sendTransaction({
    to,
    value: parseEther(amountInEther), // "0.1" → 100000000000000000n
  });
  
  console.log('交易哈希:', tx.hash);
  
  // 等待确认
  const receipt = await tx.wait();
  console.log('确认区块:', receipt.blockNumber);
  console.log('Gas 花费:', formatEther(receipt.fee), 'ETH');
  
  return receipt;
}
```

### 签名消息

```javascript
// 个人签名（用于登录验证、离线授权等）
const message = "Welcome to MyDApp! Sign to verify your identity.";
const signature = await signer.signMessage(message);

// 后端验证
import { verifyMessage } from 'ethers';
const recoveredAddress = verifyMessage(message, signature);
console.log(recoveredAddress === address); // true
```

## Contract 交互

### 创建 Contract 实例

```javascript
import { Contract } from 'ethers';

// ABI 可以是完整 JSON，也可以是简写的人类可读格式
const abi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

const contractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC

// 只读实例（用 Provider）
const readContract = new Contract(contractAddress, abi, provider);

// 可写实例（用 Signer）
const writeContract = new Contract(contractAddress, abi, signer);
```

### 读取合约数据（view 函数）

```javascript
// 读取代币基础信息
const name = await readContract.name();           // "USD Coin"
const symbol = await readContract.symbol();       // "USDC"
const decimals = await readContract.decimals();   // 6n

// 查询用户余额
const balance = await readContract.balanceOf(userAddress);
const formatted = formatUnits(balance, decimals); // "1000.50"

// 查询授权额度
const allowance = await readContract.allowance(owner, spender);
```

### 写入合约（发送交易）

```javascript
// ERC-20 转账
async function transferToken(to, amount) {
  const decimals = await writeContract.decimals();
  const parsedAmount = parseUnits(amount, decimals); // "100" → 100000000n (USDC 6位)
  
  // 发送交易（会弹出 MetaMask 确认）
  const tx = await writeContract.transfer(to, parsedAmount);
  console.log('交易已提交:', tx.hash);
  
  // 等待确认
  const receipt = await tx.wait();
  return receipt;
}

// 授权操作
async function approveToken(spender, amount) {
  const decimals = await writeContract.decimals();
  const parsedAmount = parseUnits(amount, decimals);
  
  const tx = await writeContract.approve(spender, parsedAmount);
  await tx.wait();
  console.log('授权成功');
}
```

### 估算 Gas

```javascript
// 估算交易所需 Gas
const gasEstimate = await writeContract.transfer.estimateGas(to, amount);
console.log(`预估 Gas: ${gasEstimate}`); // 例如 65000n

// 结合 Gas Price 计算费用
const feeData = await provider.getFeeData();
const estimatedFee = gasEstimate * feeData.maxFeePerGas;
console.log(`预估费用: ${formatEther(estimatedFee)} ETH`);
```

### 等待交易确认

```javascript
// 基础等待
const receipt = await tx.wait(); // 默认等 1 个确认

// 等待多个确认（更安全）
const receipt = await tx.wait(3); // 等待 3 个确认

// 带超时的等待
const receipt = await Promise.race([
  tx.wait(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('交易超时')), 60000)
  ),
]);
```

## 事件监听

### 监听合约事件

```javascript
// 实时监听 Transfer 事件
writeContract.on('Transfer', (from, to, value, event) => {
  console.log(`转账: ${from} → ${to}, 金额: ${formatUnits(value, 6)}`);
  console.log('交易哈希:', event.log.transactionHash);
});

// 只监听一次
writeContract.once('Transfer', (from, to, value) => {
  console.log('收到第一笔转账');
});

// 监听特定地址的转账（过滤）
const filter = writeContract.filters.Transfer(myAddress, null); // 从 myAddress 转出
writeContract.on(filter, (from, to, value) => {
  console.log(`我转出了 ${formatUnits(value, 6)} USDC 给 ${to}`);
});
```

### 查询历史事件

```javascript
// 查询过去的 Transfer 事件
const filter = writeContract.filters.Transfer();

// 查最近 1000 个区块的事件
const currentBlock = await provider.getBlockNumber();
const events = await writeContract.queryFilter(filter, currentBlock - 1000, currentBlock);

events.forEach(event => {
  console.log(`区块 ${event.blockNumber}: ${event.args.from} → ${event.args.to}`);
  console.log(`金额: ${formatUnits(event.args.value, 6)}`);
});
```

## 错误处理

### 常见错误类型

| 错误码 | 含义 | 前端处理方式 |
|--------|------|-------------|
| ACTION_REJECTED | 用户拒绝签名 | 提示"已取消" |
| INSUFFICIENT_FUNDS | 余额不足 | 显示余额不足提示 |
| NONCE_TOO_LOW | Nonce 冲突 | 自动重试或提示 |
| UNPREDICTABLE_GAS_LIMIT | Gas 估算失败 | 合约可能会 revert |
| CALL_EXCEPTION | 合约执行失败 | 解析 revert 原因 |
| NETWORK_ERROR | 网络问题 | 提示检查网络 |
| TRANSACTION_REPLACED | 交易被替换 | 用新交易哈希更新 UI |

### 错误处理最佳实践

```javascript
import { isError } from 'ethers';

async function safeContractCall(contract, method, ...args) {
  try {
    const tx = await contract[method](...args);
    const receipt = await tx.wait();
    return { success: true, receipt };
  } catch (error) {
    // ethers v6 错误处理
    if (isError(error, 'ACTION_REJECTED')) {
      return { success: false, message: '你取消了交易' };
    }
    
    if (isError(error, 'INSUFFICIENT_FUNDS')) {
      return { success: false, message: 'ETH 余额不足以支付 Gas 费' };
    }
    
    if (isError(error, 'CALL_EXCEPTION')) {
      // 解析合约 revert 原因
      const reason = error.reason || '合约执行失败';
      return { success: false, message: reason };
    }
    
    if (isError(error, 'TRANSACTION_REPLACED')) {
      if (error.cancelled) {
        return { success: false, message: '交易已被取消' };
      }
      // 交易被加速，用新的 receipt
      return { success: true, receipt: error.receipt };
    }
    
    return { success: false, message: '未知错误，请稍后重试' };
  }
}
```

### 用户友好的错误展示

```tsx
function TransactionError({ error }: { error: string }) {
  const errorMessages: Record<string, { title: string; tip: string }> = {
    ACTION_REJECTED: {
      title: '交易已取消',
      tip: '你在钱包中拒绝了这笔交易',
    },
    INSUFFICIENT_FUNDS: {
      title: '余额不足',
      tip: '你的 ETH 余额不够支付 Gas 费，请充值后重试',
    },
    CALL_EXCEPTION: {
      title: '交易将失败',
      tip: '合约执行会失败，可能是余额不足或不满足条件',
    },
  };

  const info = errorMessages[error] || { title: '交易失败', tip: '请稍后重试' };

  return (
    <div className="error-card">
      <h3>❌ {info.title}</h3>
      <p>{info.tip}</p>
    </div>
  );
}
```

## 实战案例：ERC-20 代币完整交互

```tsx
import { useState } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits, isError } from 'ethers';

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

function useERC20(tokenAddress: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getContract(needSigner = false) {
    const provider = new BrowserProvider(window.ethereum);
    const signerOrProvider = needSigner ? await provider.getSigner() : provider;
    return new Contract(tokenAddress, ERC20_ABI, signerOrProvider);
  }

  async function getTokenInfo() {
    const contract = await getContract();
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);
    return { name, symbol, decimals: Number(decimals) };
  }

  async function getBalance(address: string) {
    const contract = await getContract();
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals(),
    ]);
    return formatUnits(balance, decimals);
  }

  async function transfer(to: string, amount: string) {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract(true);
      const decimals = await contract.decimals();
      const parsedAmount = parseUnits(amount, decimals);
      
      const tx = await contract.transfer(to, parsedAmount);
      const receipt = await tx.wait();
      return receipt;
    } catch (err: any) {
      if (isError(err, 'ACTION_REJECTED')) setError('交易已取消');
      else if (isError(err, 'INSUFFICIENT_FUNDS')) setError('余额不足');
      else setError(err.reason || '转账失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { getTokenInfo, getBalance, transfer, loading, error };
}
```

:::warning 安全提醒
- 永远不要在前端代码中硬编码私钥
- `parseUnits` 的精度必须与代币的 `decimals` 匹配（USDC 是 6，大部分代币是 18）
- 大额转账前先调用 `estimateGas` 确认交易不会失败
:::

## 面试常见问题

### 1. Provider 和 Signer 有什么区别？

Provider 是只读连接，只能查询数据；Signer 拥有私钥，可以签名和发送交易。设计上分离是为了安全——读取数据不需要暴露私钥。

### 2. ethers.js v6 中如何处理大数？

v6 使用原生 BigInt（如 `1000000000000000000n`），替代了 v5 的 BigNumber 类。使用 `parseEther("1.0")` 和 `formatEther(value)` 进行转换。

### 3. 如何同时调用多个合约的 view 函数？

使用 `Promise.all` 并行调用，或使用 Multicall 合约在一次 RPC 请求中批量调用多个方法，减少请求次数。

### 4. 合约交互中 `view` 函数和普通函数有什么区别？

`view` 函数只读取数据不修改状态，调用免费（不消耗 Gas），返回值直接可用。普通函数会修改状态，需要发送交易、消耗 Gas、等待确认。

### 5. 如何处理交易被替换（加速/取消）的情况？

监听 `TRANSACTION_REPLACED` 错误。如果 `error.cancelled` 为 true，说明交易被取消；否则交易被新交易替换，新的 receipt 在 `error.receipt` 中。
