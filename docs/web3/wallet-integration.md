---
sidebar_position: 3
title: '钱包集成实战'
difficulty: 'medium'
tags: ['web3', 'MetaMask', 'WalletConnect', '钱包']
---

# 钱包集成实战

## Web3 钱包的角色

在 Web3 中，钱包不仅仅是「存钱的地方」，它承担三重角色：

| 角色     | 类比               | 具体功能                 |
| -------- | ------------------ | ------------------------ |
| 身份认证 | 相当于「登录账号」 | 用地址标识用户身份       |
| 交易签名 | 相当于「支付密码」 | 用私钥对交易进行数字签名 |
| 资产管理 | 相当于「银行账户」 | 查看和管理链上资产       |

:::info 核心概念
Web3 中没有「用户名 + 密码」的概念。用户的身份 = 钱包地址，用户的授权 = 私钥签名。前端不再调用登录 API，而是请求钱包连接。
:::

## MetaMask 集成完整教程

### 检测 MetaMask 是否安装

```javascript
function isMetaMaskInstalled() {
  // MetaMask 会注入 window.ethereum 对象
  const {ethereum} = window;
  return Boolean(ethereum && ethereum.isMetaMask);
}

// 引导用户安装
if (!isMetaMaskInstalled()) {
  window.open('https://metamask.io/download/', '_blank');
}
```

### 连接钱包

```javascript
async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('请安装 MetaMask');
  }

  try {
    // 请求用户授权连接（会弹出 MetaMask 弹窗）
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    return accounts[0]; // 返回用户选择的账户地址
  } catch (error) {
    if (error.code === 4001) {
      // 用户拒绝了连接请求
      console.log('用户拒绝连接');
    }
    throw error;
  }
}
```

### 获取账户信息和余额

```javascript
import {BrowserProvider, formatEther} from 'ethers';

async function getAccountInfo() {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);
  const network = await provider.getNetwork();

  return {
    address, // "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
    balance: formatEther(balance), // "1.5" (ETH)
    chainId: network.chainId, // 1n (主网)
    networkName: network.name, // "mainnet"
  };
}
```

### 监听账户/网络切换事件

```javascript
function setupEventListeners(onAccountChange, onChainChange) {
  const {ethereum} = window;

  // 用户切换账户
  ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      // 用户断开了连接
      onAccountChange(null);
    } else {
      onAccountChange(accounts[0]);
    }
  });

  // 用户切换网络
  ethereum.on('chainChanged', (chainId) => {
    // 推荐刷新页面以重置所有状态
    onChainChange(chainId);
    // window.location.reload(); // 简单粗暴但安全的做法
  });

  // 清理函数
  return () => {
    ethereum.removeAllListeners('accountsChanged');
    ethereum.removeAllListeners('chainChanged');
  };
}
```

### React Hook 封装

```tsx
import {useState, useEffect, useCallback} from 'react';
import {BrowserProvider, formatEther} from 'ethers';

interface WalletState {
  address: string | null;
  balance: string;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: '0',
    chainId: null,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState((prev) => ({...prev, error: '请安装 MetaMask'}));
      return;
    }

    setState((prev) => ({...prev, isConnecting: true, error: null}));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(accounts[0]);
      const network = await provider.getNetwork();

      setState({
        address: accounts[0],
        balance: formatEther(balance),
        chainId: Number(network.chainId),
        isConnecting: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err.code === 4001 ? '用户拒绝连接' : err.message,
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({address: null, balance: '0', chainId: null, isConnecting: false, error: null});
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else setState((prev) => ({...prev, address: accounts[0]}));
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect]);

  return {...state, connect, disconnect};
}
```

## 网络管理

### 切换网络

```javascript
async function switchNetwork(chainId) {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{chainId: `0x${chainId.toString(16)}`}],
    });
  } catch (error) {
    // 4902: 用户钱包中没有这个网络，需要先添加
    if (error.code === 4902) {
      await addNetwork(chainId);
    }
  }
}
```

### 添加自定义网络

```javascript
const NETWORKS = {
  polygon: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    nativeCurrency: {name: 'MATIC', symbol: 'MATIC', decimals: 18},
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  arbitrum: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    nativeCurrency: {name: 'ETH', symbol: 'ETH', decimals: 18},
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  sepolia: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    nativeCurrency: {name: 'ETH', symbol: 'ETH', decimals: 18},
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
};

async function addNetwork(networkKey) {
  const params = NETWORKS[networkKey];
  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [params],
  });
}
```

## WalletConnect 集成

### WalletConnect v2 原理

WalletConnect 通过中继服务器建立 DApp 和手机钱包之间的加密通信：

```
DApp（浏览器）  ←→  中继服务器  ←→  手机钱包
                    (WebSocket)
```

用户扫描二维码后，两端建立加密会话，后续所有签名请求通过加密通道传输。

### 基础配置

```javascript
import {WalletConnectModal} from '@walletconnect/modal';
import {createWeb3Modal, defaultConfig} from '@web3modal/ethers';

const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID'; // 在 cloud.walletconnect.com 获取

const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://eth.llamarpc.com',
};

const modal = createWeb3Modal({
  ethersConfig: defaultConfig({metadata: {name: 'My DApp', description: '...', url: '...', icons: ['...']}}),
  chains: [mainnet],
  projectId,
});
```

### 支持的钱包

WalletConnect v2 支持 300+ 钱包，包括：MetaMask Mobile、Rainbow、Trust Wallet、Coinbase Wallet、imToken 等。

## wagmi + RainbowKit 现代方案

### 为什么使用？

| 优势         | 说明                                      |
| ------------ | ----------------------------------------- |
| 声明式 Hooks | 像使用 React Query 一样管理链上数据       |
| 多钱包支持   | 内置 MetaMask、WalletConnect、Coinbase 等 |
| TypeScript   | 完整类型推导，合约调用类型安全            |
| 缓存管理     | 自动缓存、失效、重新获取                  |
| 开箱即用 UI  | RainbowKit 提供精美的连接弹窗             |

### 配置示例

```tsx
// config.ts
import {getDefaultConfig} from '@rainbow-me/rainbowkit';
import {mainnet, polygon, arbitrum, sepolia} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'My DApp',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, arbitrum, sepolia],
});

// App.tsx
import {WagmiProvider} from 'wagmi';
import {RainbowKitProvider, ConnectButton} from '@rainbow-me/rainbowkit';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {config} from './config';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ConnectButton /> {/* 一行代码搞定钱包连接 UI */}
          <YourApp />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 常用 Hooks

```tsx
import {useAccount, useConnect, useDisconnect, useBalance} from 'wagmi';

function WalletInfo() {
  const {address, isConnected, chain} = useAccount();
  const {connect, connectors} = useConnect();
  const {disconnect} = useDisconnect();
  const {data: balance} = useBalance({address});

  if (!isConnected) {
    return (
      <div>
        {connectors.map((connector) => (
          <button key={connector.id} onClick={() => connect({connector})}>
            连接 {connector.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <p>地址: {address}</p>
      <p>
        余额: {balance?.formatted} {balance?.symbol}
      </p>
      <p>网络: {chain?.name}</p>
      <button onClick={() => disconnect()}>断开连接</button>
    </div>
  );
}
```

## 安全最佳实践

### 签名验证（EIP-191 & EIP-712）

```javascript
// EIP-191: 简单消息签名（登录验证）
const message = `登录 MyDApp\n时间: ${Date.now()}\nNonce: ${nonce}`;
const signature = await signer.signMessage(message);

// EIP-712: 结构化数据签名（更安全，用户可读）
const domain = {
  name: 'MyDApp',
  version: '1',
  chainId: 1,
  verifyingContract: '0x...',
};

const types = {
  Order: [
    {name: 'seller', type: 'address'},
    {name: 'price', type: 'uint256'},
    {name: 'nonce', type: 'uint256'},
  ],
};

const value = {seller: address, price: parseEther('1.0'), nonce: 1};
const signature = await signer.signTypedData(domain, types, value);
```

:::warning 安全警告

- **永远不要**让用户签署他们不理解的内容
- 使用 EIP-712 结构化签名，让用户能在钱包中看到签名内容
- 在签名请求中包含时间戳和 nonce，防止重放攻击
  :::

### 防钓鱼攻击

```javascript
// 1. 验证当前网站 URL（防止仿冒网站）
// 2. 显示完整合约地址，让用户确认
// 3. 对于大额授权，显示明确警告

function ApprovalWarning({spender, amount}) {
  return (
    <div className="warning-banner">
      <p>⚠️ 你正在授权以下合约操作你的代币：</p>
      <p>合约地址: {spender}</p>
      <p>授权数量: {amount === MaxUint256 ? '无限制（危险）' : formatAmount(amount)}</p>
      {amount === MaxUint256 && <p className="danger">建议设置具体授权数量而非无限授权！</p>}
    </div>
  );
}
```

### 权限最小化原则

- 只请求必要的权限（不要一次性请求所有账户）
- 授权代币时设置具体数量而非 `type(uint256).max`
- 提供「撤销授权」功能
- 显示当前所有活跃授权列表

## 面试常见问题

### 1. MetaMask 连接流程中 `eth_requestAccounts` 和 `eth_accounts` 的区别？

`eth_requestAccounts` 会触发弹窗请求用户授权，`eth_accounts` 只返回已授权的账户列表（不弹窗）。首次连接用前者，检查是否已连接用后者。

### 2. 为什么切换网络后推荐刷新页面？

因为 Provider 实例、合约实例、缓存数据都绑定了特定网络。切换网络后如果不刷新，可能导致使用旧网络的 Provider 发送交易到新网络，产生错误。

### 3. WalletConnect 和 MetaMask 直连的区别？

MetaMask 直连通过浏览器注入的 `window.ethereum` 通信，只支持 MetaMask 浏览器扩展。WalletConnect 通过中继服务器通信，支持手机上的各种钱包 App，适用面更广。

### 4. 什么是签名重放攻击？如何防御？

攻击者截获一个有效签名后，在另一个时间或网络上重复使用。防御方式：在签名内容中包含 chainId（防跨链重放）、nonce（防同链重放）、deadline（限时有效）。

### 5. 如何安全地存储用户的连接状态？

连接状态（地址、chainId）可以存在 localStorage 用于恢复 UI，但关键操作必须重新请求签名。永远不要在前端存储私钥或助记词。
