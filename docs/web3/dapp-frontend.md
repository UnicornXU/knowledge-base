---
sidebar_position: 5
title: 'DApp 前端开发'
difficulty: 'hard'
tags: ['DApp', '前端架构', 'NFT', '安全']
---

# DApp 前端开发

## DApp 前端架构设计

### 传统 Web App vs DApp 架构

```
传统 Web App:
┌──────────┐     ┌──────────┐     ┌──────────┐
│  前端     │ ──→ │  后端 API │ ──→ │  数据库   │
└──────────┘     └──────────┘     └──────────┘

DApp:
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  前端     │ ──→ │  区块链 (RPC) │     │  IPFS    │
│          │     └──────────────┘     └──────────┘
│          │ ──→ ┌──────────────┐
│          │     │  The Graph   │  (索引服务，可选)
└──────────┘     └──────────────┘
```

| 维度       | 传统 Web App          | DApp                      |
| ---------- | --------------------- | ------------------------- |
| 数据源     | 后端 REST/GraphQL API | 区块链 RPC + 索引服务     |
| 身份认证   | JWT / Session         | 钱包签名                  |
| 状态持久化 | 数据库 CRUD           | 智能合约交易              |
| 写入延迟   | 毫秒级                | 秒到分钟级（等区块确认）  |
| 失败处理   | 重试即可              | 交易可能永久失败 + 扣 Gas |
| 费用       | 服务器付费            | 用户付 Gas 费             |

### 数据获取策略

| 方式                 | 适用场景                 | 优点                | 缺点                 |
| -------------------- | ------------------------ | ------------------- | -------------------- |
| 直接 RPC             | 简单查询(余额、单个状态) | 实时、无依赖        | 复杂查询慢，不能聚合 |
| The Graph            | 历史数据、复杂查询       | 类 SQL 查询、速度快 | 需要部署子图、有延迟 |
| 事件监听             | 实时更新                 | 实时推送            | 只能获取新事件       |
| Alchemy Enhanced API | NFT 列表、代币余额       | 聚合数据、开箱即用  | 依赖第三方服务       |

## 状态管理实战

### 钱包连接状态

```typescript
// 使用 Zustand 管理全局钱包状态
import {create} from 'zustand';

interface Web3Store {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  checkNetwork: () => void;
}

const TARGET_CHAIN_ID = 1; // 目标网络

export const useWeb3Store = create<Web3Store>((set, get) => ({
  address: null,
  chainId: null,
  isConnected: false,
  isCorrectNetwork: false,

  connect: async () => {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    const chainId = await window.ethereum.request({method: 'eth_chainId'});
    const numericChainId = parseInt(chainId, 16);

    set({
      address: accounts[0],
      chainId: numericChainId,
      isConnected: true,
      isCorrectNetwork: numericChainId === TARGET_CHAIN_ID,
    });
  },

  disconnect: () => {
    set({address: null, chainId: null, isConnected: false, isCorrectNetwork: false});
  },

  checkNetwork: () => {
    const {chainId} = get();
    set({isCorrectNetwork: chainId === TARGET_CHAIN_ID});
  },
}));
```

### 交易状态管理

```typescript
type TxStatus = 'idle' | 'confirming' | 'pending' | 'success' | 'failed';

interface Transaction {
  id: string;
  hash: string | null;
  status: TxStatus;
  description: string;
  error?: string;
  confirmedAt?: number;
}

interface TxStore {
  transactions: Transaction[];
  addTx: (id: string, description: string) => void;
  updateTx: (id: string, updates: Partial<Transaction>) => void;
}

export const useTxStore = create<TxStore>((set) => ({
  transactions: [],

  addTx: (id, description) =>
    set((state) => ({
      transactions: [
        ...state.transactions,
        {
          id,
          hash: null,
          status: 'confirming', // 等待钱包确认
          description,
        },
      ],
    })),

  updateTx: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((tx) => (tx.id === id ? {...tx, ...updates} : tx)),
    })),
}));

// 使用示例
async function executeTransaction(contract, method, args, description) {
  const txId = crypto.randomUUID();
  const {addTx, updateTx} = useTxStore.getState();

  addTx(txId, description);

  try {
    // 发送交易（等待钱包签名）
    const tx = await contract[method](...args);
    updateTx(txId, {hash: tx.hash, status: 'pending'});

    // 等待确认
    const receipt = await tx.wait();
    updateTx(txId, {
      status: receipt.status === 1 ? 'success' : 'failed',
      confirmedAt: Date.now(),
    });
  } catch (error) {
    updateTx(txId, {
      status: 'failed',
      error: error.code === 'ACTION_REJECTED' ? '已取消' : error.message,
    });
  }
}
```

### 链上数据缓存

```typescript
// 使用 React Query 缓存链上数据
import {useQuery} from '@tanstack/react-query';

function useTokenBalance(tokenAddress: string, userAddress: string) {
  return useQuery({
    queryKey: ['tokenBalance', tokenAddress, userAddress],
    queryFn: async () => {
      const contract = new Contract(tokenAddress, ERC20_ABI, provider);
      const [balance, decimals] = await Promise.all([contract.balanceOf(userAddress), contract.decimals()]);
      return formatUnits(balance, decimals);
    },
    staleTime: 15_000, // 15秒内认为数据新鲜
    refetchInterval: 30_000, // 每30秒自动刷新
    enabled: !!userAddress, // 地址存在时才查询
  });
}
```

## 交易 UI 设计

### 交易确认弹窗

```tsx
function TransactionConfirmModal({isOpen, onConfirm, onCancel, txDetails}) {
  return (
    <Modal isOpen={isOpen}>
      <h2>确认交易</h2>

      <div className="tx-summary">
        <div className="tx-row">
          <span>操作</span>
          <span>{txDetails.action}</span>
        </div>
        <div className="tx-row">
          <span>金额</span>
          <span>
            {txDetails.amount} {txDetails.symbol}
          </span>
        </div>
        <div className="tx-row">
          <span>接收地址</span>
          <span title={txDetails.to}>
            {txDetails.to.slice(0, 6)}...{txDetails.to.slice(-4)}
          </span>
        </div>
        <div className="tx-row">
          <span>预估 Gas 费</span>
          <span>~{txDetails.estimatedGas} ETH</span>
        </div>
      </div>

      <div className="tx-actions">
        <button onClick={onCancel}>取消</button>
        <button onClick={onConfirm} className="primary">
          确认
        </button>
      </div>
    </Modal>
  );
}
```

### 交易状态展示组件

```tsx
function TransactionStatus({tx}: {tx: Transaction}) {
  const statusConfig = {
    confirming: {icon: '🔐', text: '请在钱包中确认...', color: 'blue'},
    pending: {icon: '⏳', text: '交易处理中...', color: 'orange'},
    success: {icon: '✅', text: '交易成功', color: 'green'},
    failed: {icon: '❌', text: '交易失败', color: 'red'},
  };

  const config = statusConfig[tx.status];

  return (
    <div className={`tx-status tx-status--${config.color}`}>
      <span className="tx-icon">{config.icon}</span>
      <div className="tx-info">
        <p className="tx-description">{tx.description}</p>
        <p className="tx-status-text">{config.text}</p>
        {tx.hash && (
          <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
            查看交易详情 ↗
          </a>
        )}
        {tx.error && <p className="tx-error">{tx.error}</p>}
      </div>
    </div>
  );
}
```

## NFT 前端展示

### NFT 元数据获取

```typescript
// NFT 元数据标准结构
interface NFTMetadata {
  name: string;
  description: string;
  image: string; // 图片 URL（可能是 IPFS）
  animation_url?: string; // 视频/3D/音频
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

async function fetchNFTMetadata(contractAddress: string, tokenId: string) {
  const contract = new Contract(
    contractAddress,
    ['function tokenURI(uint256 tokenId) view returns (string)'],
    provider,
  );

  // 1. 获取 tokenURI
  let tokenURI = await contract.tokenURI(tokenId);

  // 2. 处理 IPFS URI
  if (tokenURI.startsWith('ipfs://')) {
    tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }

  // 3. 获取元数据 JSON
  const response = await fetch(tokenURI);
  const metadata: NFTMetadata = await response.json();

  // 4. 处理图片 URI
  if (metadata.image.startsWith('ipfs://')) {
    metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }

  return metadata;
}
```

### NFT 卡片组件

```tsx
function NFTCard({contractAddress, tokenId}: {contractAddress: string; tokenId: string}) {
  const {data: metadata, isLoading} = useQuery({
    queryKey: ['nft', contractAddress, tokenId],
    queryFn: () => fetchNFTMetadata(contractAddress, tokenId),
    staleTime: 5 * 60 * 1000, // NFT 元数据不常变，缓存5分钟
  });

  if (isLoading) return <div className="nft-skeleton" />;

  return (
    <div className="nft-card">
      <div className="nft-media">
        {metadata.animation_url ? (
          <video src={metadata.animation_url} autoPlay loop muted />
        ) : (
          <img src={metadata.image} alt={metadata.name} loading="lazy" />
        )}
      </div>
      <div className="nft-info">
        <h3>{metadata.name}</h3>
        <p>{metadata.description}</p>
        <div className="nft-attributes">
          {metadata.attributes.map((attr) => (
            <span key={attr.trait_type} className="attribute-tag">
              {attr.trait_type}: {attr.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### NFT 铸造交互

```tsx
function MintNFT({contractAddress, price}: {contractAddress: string; price: string}) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle');

  async function handleMint() {
    setStatus('minting');
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, ['function mint(uint256 quantity) payable'], signer);

      const totalPrice = parseEther(price) * BigInt(quantity);
      const tx = await contract.mint(quantity, {value: totalPrice});
      await tx.wait();
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  }

  return (
    <div className="mint-section">
      <div className="quantity-selector">
        <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
        <span>{quantity}</span>
        <button onClick={() => setQuantity((q) => Math.min(10, q + 1))}>+</button>
      </div>
      <p>总价: {(parseFloat(price) * quantity).toFixed(4)} ETH</p>
      <button onClick={handleMint} disabled={status === 'minting'}>
        {status === 'minting' ? 'Minting...' : `Mint ${quantity} NFT`}
      </button>
      {status === 'success' && <p className="success">铸造成功！🎉</p>}
    </div>
  );
}
```

## 安全最佳实践

### 前端安全防护

:::warning 安全第一
Web3 DApp 涉及真实资产，安全问题可能导致用户资金损失。以下是必须遵守的安全规则。
:::

| 风险     | 攻击方式               | 防御策略              |
| -------- | ---------------------- | --------------------- |
| 恶意合约 | 引导用户与恶意合约交互 | 白名单验证合约地址    |
| 精度攻击 | 利用浮点数误差         | 始终使用 BigInt 计算  |
| 签名钓鱼 | 伪造签名请求窃取资产   | 明确展示签名内容      |
| 重放攻击 | 重复使用有效签名       | 包含 nonce 和过期时间 |
| 授权滥用 | 无限授权后转走代币     | 限制授权额度          |

### 金额显示精度

```typescript
import {formatUnits, parseUnits} from 'ethers';

// ❌ 错误：使用浮点数计算
const wrong = 0.1 + 0.2; // 0.30000000000000004

// ✅ 正确：始终使用 BigInt
const amount1 = parseUnits('0.1', 18); // 100000000000000000n
const amount2 = parseUnits('0.2', 18); // 200000000000000000n
const total = amount1 + amount2; // 300000000000000000n
const display = formatUnits(total, 18); // "0.3"

// 格式化显示工具函数
function formatTokenAmount(amount: bigint, decimals: number, maxDisplay = 6): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);

  if (num === 0) return '0';
  if (num < 0.000001) return '< 0.000001';

  // 根据大小决定显示精度
  if (num >= 1000) return num.toLocaleString('en-US', {maximumFractionDigits: 2});
  if (num >= 1) return num.toFixed(4);
  return num.toFixed(maxDisplay);
}
```

### 合约地址验证

```typescript
// 维护已验证的合约地址白名单
const VERIFIED_CONTRACTS: Record<number, Record<string, string>> = {
  1: {
    // Ethereum Mainnet
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  137: {
    // Polygon
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
};

function isVerifiedContract(chainId: number, address: string): boolean {
  const contracts = VERIFIED_CONTRACTS[chainId];
  if (!contracts) return false;
  return Object.values(contracts).includes(address.toLowerCase());
}
```

### 防重放攻击

```typescript
// 签名中包含防重放元素
async function createSignedMessage(signer, action, data) {
  const message = JSON.stringify({
    action,
    data,
    chainId: (await signer.provider.getNetwork()).chainId.toString(),
    nonce: crypto.randomUUID(), // 唯一标识
    deadline: Math.floor(Date.now() / 1000) + 300, // 5分钟过期
  });

  const signature = await signer.signMessage(message);
  return {message, signature};
}
```

## 性能优化

### RPC 请求批处理（Multicall）

```typescript
import {Contract} from 'ethers';

// Multicall3 合约地址（部署在所有主流链上）
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
const MULTICALL3_ABI = [
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) returns (tuple(bool success, bytes returnData)[])',
];

async function multicall(provider, calls) {
  const multicall = new Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);

  const callData = calls.map(({contract, method, args}) => ({
    target: contract.target,
    allowFailure: true,
    callData: contract.interface.encodeFunctionData(method, args),
  }));

  const results = await multicall.aggregate3(callData);

  return results.map((result, i) => {
    if (!result.success) return null;
    const {contract, method} = calls[i];
    return contract.interface.decodeFunctionResult(method, result.returnData);
  });
}

// 使用：一次 RPC 调用获取 10 个代币的余额
const balances = await multicall(
  provider,
  tokens.map((token) => ({
    contract: new Contract(token.address, ERC20_ABI, provider),
    method: 'balanceOf',
    args: [userAddress],
  })),
);
```

### 数据缓存与失效策略

```typescript
// 不同数据类型的缓存策略
const CACHE_CONFIG = {
  // 几乎不变的数据：长时间缓存
  tokenInfo: {staleTime: 24 * 60 * 60 * 1000}, // 24小时
  nftMetadata: {staleTime: 60 * 60 * 1000}, // 1小时

  // 频繁变化的数据：短缓存 + 自动刷新
  tokenBalance: {staleTime: 15_000, refetchInterval: 30_000},
  gasPrice: {staleTime: 5_000, refetchInterval: 10_000},

  // 交易后立即失效
  afterTx: {staleTime: 0}, // 交易成功后强制刷新相关数据
};

// 交易成功后使相关缓存失效
function invalidateAfterTx(queryClient, tokenAddress, userAddress) {
  queryClient.invalidateQueries(['tokenBalance', tokenAddress, userAddress]);
  queryClient.invalidateQueries(['allowance', tokenAddress, userAddress]);
}
```

:::tip 性能建议

- 使用 Multicall 将多个 RPC 调用合并为一次请求
- 对 NFT 元数据等不变数据启用长期缓存
- 交易成功后立即 invalidate 相关查询
- 大量 NFT 列表使用虚拟滚动 + 图片懒加载
  :::

## 面试常见问题

### 1. DApp 前端如何处理交易 pending 状态？

发送交易后立即展示 pending 状态和交易哈希链接。使用 `tx.wait()` 监听确认，同时设置超时处理。对于 replaced 的交易，需要更新为新的交易哈希。可以使用状态机模式管理 idle→confirming→pending→success/failed 的流转。

### 2. 为什么 DApp 需要使用 BigInt 而不是 Number？

以太坊的最小单位是 wei（1 ETH = 10^18 wei），数值远超 JavaScript Number 的安全整数范围（2^53）。使用 Number 会导致精度丢失。BigInt 支持任意精度整数运算。

### 3. 什么是 The Graph？为什么需要它？

区块链 RPC 只支持简单查询（按地址/区块号），不支持复杂聚合查询。The Graph 索引链上事件生成子图，支持类 GraphQL 查询，适合获取历史数据、排行榜、统计信息等。

### 4. 如何设计 DApp 的错误边界？

分层处理：网络层（RPC 连接失败 → 重试/切换节点）、钱包层（拒绝签名 → 温和提示）、合约层（revert → 解析错误原因展示）、业务层（余额不足 → 引导充值）。每层有对应的 UI 反馈。

### 5. 前端如何防止用户与恶意合约交互？

白名单验证合约地址、展示合约是否已验证（Etherscan verified）、对 approve 操作显示风险提示、限制授权额度、在签名前展示完整交易内容让用户确认。
