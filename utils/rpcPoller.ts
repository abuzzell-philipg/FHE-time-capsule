import { ethers } from "ethers";

/**
 * RPC 端点配置
 */
export interface RpcEndpoint {
  name: string;
  url: string;
  timeout?: number;
}

/**
 * Sepolia 测试网 RPC 端点列表
 */
export const SEPOLIA_RPC_ENDPOINTS: RpcEndpoint[] = [
  {
    name: "sepolia",
    url: "https://rpc.sepolia.org",
    timeout: 10000,
  },
  {
    name: "sepolia2",
    url: "https://ethereum-sepolia-rpc.publicnode.com",
    timeout: 10000,
  },
  {
    name: "sepolia3",
    url: "https://sepolia.gateway.tenderly.co",
    timeout: 10000,
  },
  {
    name: "sepolia4",
    url: "https://rpc2.sepolia.org",
    timeout: 10000,
  },
  {
    name: "sepolia5",
    url: "https://eth-sepolia.public.blastapi.io",
    timeout: 10000,
  },
];

/**
 * 测试单个 RPC 端点是否可用
 */
async function testRpcEndpoint(endpoint: RpcEndpoint): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(endpoint.url, undefined, {
      staticNetwork: true,
    });

    // 设置超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), endpoint.timeout || 10000);
    });

    // 尝试获取最新区块号
    const blockNumberPromise = provider.getBlockNumber();

    await Promise.race([blockNumberPromise, timeoutPromise]);

    return true;
  } catch (error: any) {
    return false;
  }
}

/**
 * 轮询所有 RPC 端点，返回第一个可用的
 */
export async function findWorkingRpc(
  endpoints: RpcEndpoint[] = SEPOLIA_RPC_ENDPOINTS,
  verbose: boolean = true
): Promise<RpcEndpoint | null> {
  if (verbose) {
    console.log(`\n🔍 开始轮询 ${endpoints.length} 个 RPC 端点...\n`);
  }

  for (const endpoint of endpoints) {
    if (verbose) {
      process.stdout.write(`   测试 ${endpoint.name} (${endpoint.url})... `);
    }

    const isWorking = await testRpcEndpoint(endpoint);

    if (isWorking) {
      if (verbose) {
        console.log(`✅ 可用`);
        console.log(`\n✨ 找到可用的 RPC: ${endpoint.name}`);
        console.log(`   URL: ${endpoint.url}\n`);
      }
      return endpoint;
    } else {
      if (verbose) {
        console.log(`❌ 不可用`);
      }
    }
  }

  if (verbose) {
    console.log(`\n⚠️  所有 RPC 端点都不可用！\n`);
  }

  return null;
}

/**
 * 测试所有 RPC 端点并返回可用列表
 */
export async function testAllRpcEndpoints(
  endpoints: RpcEndpoint[] = SEPOLIA_RPC_ENDPOINTS
): Promise<RpcEndpoint[]> {
  console.log(`\n🔍 测试所有 ${endpoints.length} 个 RPC 端点...\n`);

  const workingEndpoints: RpcEndpoint[] = [];

  for (const endpoint of endpoints) {
    process.stdout.write(`   测试 ${endpoint.name} (${endpoint.url})... `);

    const isWorking = await testRpcEndpoint(endpoint);

    if (isWorking) {
      console.log(`✅ 可用`);
      workingEndpoints.push(endpoint);
    } else {
      console.log(`❌ 不可用`);
    }
  }

  console.log(`\n📊 测试结果:`);
  console.log(`   总数: ${endpoints.length}`);
  console.log(`   可用: ${workingEndpoints.length}`);
  console.log(`   不可用: ${endpoints.length - workingEndpoints.length}\n`);

  return workingEndpoints;
}

/**
 * 创建带有自动重试的 Provider
 */
export async function createResilientProvider(
  endpoints: RpcEndpoint[] = SEPOLIA_RPC_ENDPOINTS,
  verbose: boolean = true
): Promise<ethers.JsonRpcProvider | null> {
  const workingEndpoint = await findWorkingRpc(endpoints, verbose);

  if (!workingEndpoint) {
    return null;
  }

  return new ethers.JsonRpcProvider(workingEndpoint.url, undefined, {
    staticNetwork: true,
  });
}

