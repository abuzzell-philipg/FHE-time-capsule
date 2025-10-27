import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🚀 开始部署 TimeCapsule 合约...");
  console.log(`部署账户: ${deployer}`);

  // 定义所有可用的 Sepolia RPC 端点
  const rpcEndpoints = [
    { name: "Infura", url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY || 'YOUR_KEY'}` },
    { name: "PublicNode", url: "https://ethereum-sepolia-rpc.publicnode.com" },
    { name: "Tenderly", url: "https://sepolia.gateway.tenderly.co" },
    { name: "RPC2", url: "https://rpc2.sepolia.org" },
    { name: "BlastAPI", url: "https://eth-sepolia.public.blastapi.io" },
    { name: "RPC.Sepolia", url: "https://rpc.sepolia.org" },
  ];

  // 测试 RPC 连接
  console.log("\n🔍 测试 RPC 连接...");
  let workingProvider: ethers.JsonRpcProvider | null = null;
  let workingRpcName = "";

  for (const rpc of rpcEndpoints) {
    try {
      console.log(`   测试 ${rpc.name}...`);
      const provider = new ethers.JsonRpcProvider(rpc.url);
      
      // 设置超时
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );
      
      // 测试连接
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        timeoutPromise
      ]);
      
      console.log(`   ✅ ${rpc.name} 可用 (区块: ${blockNumber})`);
      workingProvider = provider;
      workingRpcName = rpc.name;
      break;
    } catch (error) {
      console.log(`   ❌ ${rpc.name} 失败`);
    }
  }

  if (!workingProvider) {
    throw new Error("❌ 所有 RPC 端点都不可用！");
  }

  console.log(`\n✅ 使用 RPC: ${workingRpcName}`);
  console.log("📝 开始部署合约...\n");

  // 部署合约
  const timeCapsule = await deploy("TimeCapsule", {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: false,
  });

  console.log(`\n✅ TimeCapsule 部署成功！`);
  console.log(`合约地址: ${timeCapsule.address}`);
  console.log(`交易哈希: ${timeCapsule.transactionHash}`);
  console.log(`Gas 使用: ${timeCapsule.receipt?.gasUsed.toString()}`);
  console.log(`使用的 RPC: ${workingRpcName}`);
};

export default func;
func.id = "deploy_timecapsule_fallback";
func.tags = ["TimeCapsule"];