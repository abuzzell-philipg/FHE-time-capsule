// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title TimeCapsule - 时间胶囊合约
/// @author FHE Time Capsule
/// @notice 用户可以加密存储消息，设定解锁时间后才能解密查看
/// @dev 使用 Zama FHE 加密 AES 密钥，AES-256-GCM 加密消息内容
contract TimeCapsule is SepoliaConfig {
    
    /// @notice 时间胶囊结构
    struct Capsule {
        address owner;                  // 胶囊所有者
        euint64 encryptedAesKey;       // FHE加密的AES密钥（前8字节）
        string encryptedContent;        // AES-256-GCM加密的内容（Base64格式）
        uint256 unlockTime;             // 解锁时间戳（Unix timestamp）
        uint256 createdAt;              // 创建时间戳
        string title;                   // 胶囊标题
        bool isUnlocked;                // 是否已解锁
    }
    
    /// @notice 存储所有胶囊
    mapping(uint256 => Capsule) public capsules;
    
    /// @notice 用户的胶囊ID列表
    mapping(address => uint256[]) public userCapsules;
    
    /// @notice 胶囊总数
    uint256 public totalCapsules;
    
    /// @notice 胶囊创建事件
    event CapsuleCreated(
        uint256 indexed capsuleId, 
        address indexed owner, 
        uint256 unlockTime,
        string title
    );
    
    /// @notice 胶囊解锁事件
    event CapsuleUnlocked(
        uint256 indexed capsuleId, 
        address indexed owner
    );
    
    /// @notice 创建时间胶囊
    /// @param encryptedKey FHE加密的AES密钥（euint64）
    /// @param inputProof FHE输入证明
    /// @param encryptedContent AES-256-GCM加密后的内容（Base64字符串）
    /// @param unlockTime 解锁时间戳（必须大于当前时间）
    /// @param title 胶囊标题
    /// @return capsuleId 创建的胶囊ID
    function createCapsule(
        externalEuint64 encryptedKey,
        bytes calldata inputProof,
        string calldata encryptedContent,
        uint256 unlockTime,
        string calldata title
    ) external returns (uint256) {
        require(unlockTime > block.timestamp, "Unlock time must be in future");
        require(bytes(encryptedContent).length > 0, "Content cannot be empty");
        require(bytes(title).length > 0, "Title cannot be empty");
        
        // 验证并导入FHE加密的密钥
        euint64 aesKey = FHE.fromExternal(encryptedKey, inputProof);
        
        // 设置访问权限：合约和创建者可以访问
        FHE.allowThis(aesKey);
        FHE.allow(aesKey, msg.sender);
        
        uint256 capsuleId = totalCapsules;
        
        capsules[capsuleId] = Capsule({
            owner: msg.sender,
            encryptedAesKey: aesKey,
            encryptedContent: encryptedContent,
            unlockTime: unlockTime,
            createdAt: block.timestamp,
            title: title,
            isUnlocked: false
        });
        
        userCapsules[msg.sender].push(capsuleId);
        totalCapsules++;
        
        emit CapsuleCreated(capsuleId, msg.sender, unlockTime, title);
        
        return capsuleId;
    }
    
    /// @notice 解锁时间胶囊（返回FHE加密的AES密钥）
    /// @dev 只有所有者在解锁时间到达后才能调用
    /// @param capsuleId 胶囊ID
    /// @return 加密的AES密钥（需要客户端使用FHE解密）
    function unlockCapsule(uint256 capsuleId) external returns (euint64) {
        Capsule storage capsule = capsules[capsuleId];
        
        require(capsule.owner != address(0), "Capsule does not exist");
        require(capsule.owner == msg.sender, "Not capsule owner");
        require(block.timestamp >= capsule.unlockTime, "Capsule still locked");
        
        if (!capsule.isUnlocked) {
            capsule.isUnlocked = true;
            emit CapsuleUnlocked(capsuleId, msg.sender);
        }
        
        return capsule.encryptedAesKey;
    }
    
    /// @notice 获取加密内容（任何时候都可以获取，但没有密钥无法解密）
    /// @param capsuleId 胶囊ID
    /// @return 加密的内容（Base64字符串）
    function getEncryptedContent(uint256 capsuleId) external view returns (string memory) {
        require(capsules[capsuleId].owner != address(0), "Capsule does not exist");
        return capsules[capsuleId].encryptedContent;
    }
    
    /// @notice 获取胶囊元数据
    /// @param capsuleId 胶囊ID
    /// @return owner 所有者地址
    /// @return unlockTime 解锁时间
    /// @return createdAt 创建时间
    /// @return title 标题
    /// @return isUnlocked 是否已解锁
    function getCapsuleInfo(uint256 capsuleId) external view returns (
        address owner,
        uint256 unlockTime,
        uint256 createdAt,
        string memory title,
        bool isUnlocked
    ) {
        Capsule storage capsule = capsules[capsuleId];
        require(capsule.owner != address(0), "Capsule does not exist");
        
        return (
            capsule.owner,
            capsule.unlockTime,
            capsule.createdAt,
            capsule.title,
            capsule.isUnlocked
        );
    }
    
    /// @notice 获取用户的所有胶囊ID
    /// @param user 用户地址
    /// @return 胶囊ID数组
    function getUserCapsules(address user) external view returns (uint256[] memory) {
        return userCapsules[user];
    }
    
    /// @notice 检查胶囊是否可以解锁
    /// @param capsuleId 胶囊ID
    /// @return 是否可以解锁
    function canUnlock(uint256 capsuleId) external view returns (bool) {
        Capsule storage capsule = capsules[capsuleId];
        return capsule.owner != address(0) && 
               block.timestamp >= capsule.unlockTime && 
               capsule.owner == msg.sender;
    }
    
    /// @notice 获取胶囊总数
    /// @return 总数
    function getTotalCapsules() external view returns (uint256) {
        return totalCapsules;
    }
    
    /// @notice 获取剩余锁定时间
    /// @param capsuleId 胶囊ID
    /// @return 剩余秒数（0表示已可解锁）
    function getRemainingTime(uint256 capsuleId) external view returns (uint256) {
        Capsule storage capsule = capsules[capsuleId];
        require(capsule.owner != address(0), "Capsule does not exist");
        
        if (block.timestamp >= capsule.unlockTime) {
            return 0;
        }
        return capsule.unlockTime - block.timestamp;
    }
}