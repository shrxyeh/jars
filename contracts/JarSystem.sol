// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title JarSystem
 * @dev A system for creating, funding, and claiming from token jars with customizable access controls
 */
contract JarSystem is ReentrancyGuard {
    using Address for address;

    // Constants
    uint256 public constant CREATION_FEE_PERCENTAGE = 1; // 1% creation fee
    uint256 public constant WITHDRAWAL_FEE_PERCENTAGE = 1; // 1% withdrawal fee
    address public immutable feeRecipient;

    // Enums
    enum AccessControlType { Open, Whitelist, ERC20Gated, NFTGated }

    // Structs
    struct Jar {
        string title;
        string description;
        address creator;
        address tokenAddress; // 0x0 for ETH
        uint256 balance;
        uint256 maxWithdrawalAmount; // 0 for no limit
        uint256 cooldownPeriod; // 0 for no cooldown
        bool isActive;
        AccessControlType accessControlType;
        address gatingTokenAddress; // For ERC20/NFT gating
        uint256 gatingTokenAmount; // Minimum amount for ERC20 gating, ignored for NFT
        mapping(address => bool) admins;
        mapping(address => bool) whitelist;
        mapping(address => bool) blacklist;
        mapping(address => uint256) lastWithdrawalTime;
    }

    struct Claim {
        address claimer;
        uint256 amount;
        string reason;
        uint256 timestamp;
    }

    // Mappings
    mapping(uint256 => Jar) public jars;
    mapping(uint256 => Claim[]) private jarClaims;
    uint256 public jarCount;

    // Events
    event JarCreated(uint256 indexed jarId, address indexed creator, string title);
    event JarFunded(uint256 indexed jarId, address indexed funder, uint256 amount);
    event JarDeleted(uint256 indexed jarId);
    event WithdrawalMade(uint256 indexed jarId, address indexed claimer, uint256 amount, string reason);
    event UserWhitelisted(uint256 indexed jarId, address indexed user);
    event UserBlacklisted(uint256 indexed jarId, address indexed user);
    event AdminAdded(uint256 indexed jarId, address indexed admin);
    event AdminRemoved(uint256 indexed jarId, address indexed admin);
    event EmergencyWithdrawal(uint256 indexed jarId, address indexed admin, uint256 amount);

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Fee recipient cannot be zero address");
        feeRecipient = _feeRecipient;
    }

    // Fallback function
    receive() external payable {}

    // Modifiers
    modifier onlyJarAdmin(uint256 _jarId) {
        require(jars[_jarId].admins[msg.sender], "Not an admin of this jar");
        _;
    }

    modifier jarExists(uint256 _jarId) {
        require(_jarId > 0 && _jarId <= jarCount, "Jar does not exist");
        require(jars[_jarId].isActive, "Jar is not active");
        _;
    }

    // Creating a new jar
    function createJar(
        string memory _title,
        string memory _description,
        address _tokenAddress,
        uint256 _initialFunding,
        uint256 _maxWithdrawalAmount,
        uint256 _cooldownPeriod,
        AccessControlType _accessControlType,
        address _gatingTokenAddress,
        uint256 _gatingTokenAmount,
        bool _payCreationFee
    ) external payable nonReentrant returns (uint256) {
        require(bytes(_title).length > 0, "Title is required");
        require(bytes(_description).length > 0, "Description is required");
        
        // Handle token validation
        if (_tokenAddress != address(0)) {
            // ERC20 token jar
            require(msg.value == 0, "ETH sent for ERC20 jar");
            require(_initialFunding > 0, "Initial funding required");
        } else {
            // ETH jar
            require(msg.value == _initialFunding, "ETH amount does not match initial funding");
        }

        // Validate access control settings
        if (_accessControlType == AccessControlType.ERC20Gated) {
            require(_gatingTokenAddress != address(0), "Gating token address required for ERC20 gating");
            require(_gatingTokenAmount > 0, "Gating token amount required for ERC20 gating");
        } else if (_accessControlType == AccessControlType.NFTGated) {
            require(_gatingTokenAddress != address(0), "Gating token address required for NFT gating");
        }

        // Create new jar
        jarCount++;
        uint256 newJarId = jarCount;

        Jar storage newJar = jars[newJarId];
        newJar.title = _title;
        newJar.description = _description;
        newJar.creator = msg.sender;
        newJar.tokenAddress = _tokenAddress;
        newJar.maxWithdrawalAmount = _maxWithdrawalAmount;
        newJar.cooldownPeriod = _cooldownPeriod;
        newJar.isActive = true;
        newJar.accessControlType = _accessControlType;
        newJar.gatingTokenAddress = _gatingTokenAddress;
        newJar.gatingTokenAmount = _gatingTokenAmount;
        
        // Set creator as admin
        newJar.admins[msg.sender] = true;

        // Handle initial funding
        if (_initialFunding > 0) {
            if (_tokenAddress == address(0)) {
                // ETH jar
                uint256 feeAmount = 0;
                if (_payCreationFee) {
                    feeAmount = (_initialFunding * CREATION_FEE_PERCENTAGE) / 100;
                    (bool feeSuccess, ) = payable(feeRecipient).call{value: feeAmount}("");
                    require(feeSuccess, "Fee transfer failed");
                }
                
                newJar.balance = _initialFunding - feeAmount;
            } else {
                // ERC20 jar
                IERC20 token = IERC20(_tokenAddress);
                
                uint256 beforeBalance = token.balanceOf(address(this));
                token.transferFrom(msg.sender, address(this), _initialFunding);
                uint256 afterBalance = token.balanceOf(address(this));
                
                uint256 actualDeposit = afterBalance - beforeBalance;
                require(actualDeposit > 0, "No tokens received");
                
                uint256 feeAmount = 0;
                if (_payCreationFee) {
                    feeAmount = (actualDeposit * CREATION_FEE_PERCENTAGE) / 100;
                    token.transfer(feeRecipient, feeAmount);
                }
                
                newJar.balance = actualDeposit - feeAmount;
            }
            
            emit JarFunded(newJarId, msg.sender, newJar.balance);
        }

        emit JarCreated(newJarId, msg.sender, _title);
        return newJarId;
    }

    // Fund an existing jar
    function fundJar(uint256 _jarId, uint256 _amount) external payable jarExists(_jarId) nonReentrant {
        Jar storage jar = jars[_jarId];
        
        if (jar.tokenAddress == address(0)) {
            // ETH jar
            require(msg.value == _amount, "ETH amount does not match funding amount");
            jar.balance += _amount;
        } else {
            // ERC20 jar
            require(msg.value == 0, "ETH sent for ERC20 jar");
            IERC20 token = IERC20(jar.tokenAddress);
            
            uint256 beforeBalance = token.balanceOf(address(this));
            token.transferFrom(msg.sender, address(this), _amount);
            uint256 afterBalance = token.balanceOf(address(this));
            
            uint256 actualDeposit = afterBalance - beforeBalance;
            jar.balance += actualDeposit;
        }
        
        emit JarFunded(_jarId, msg.sender, _amount);
    }

    // Withdraw from a jar
    function withdraw(uint256 _jarId, uint256 _amount, string memory _reason) external jarExists(_jarId) nonReentrant {
        require(bytes(_reason).length >= 3, "Reason must be at least 3 characters");
        require(_amount > 0, "Amount must be greater than 0");
        require(canUserWithdraw(_jarId, msg.sender), "Not allowed to withdraw");
        
        Jar storage jar = jars[_jarId];
        
        // Check amount limit
        if (jar.maxWithdrawalAmount > 0) {
            require(_amount <= jar.maxWithdrawalAmount, "Amount exceeds max withdrawal limit");
        }
        require(_amount <= jar.balance, "Insufficient jar balance");
        
        // Check cooldown
        if (jar.cooldownPeriod > 0) {
            uint256 lastWithdrawal = jar.lastWithdrawalTime[msg.sender];
            if (lastWithdrawal > 0) {
                require(block.timestamp >= lastWithdrawal + jar.cooldownPeriod, "Cooldown period not elapsed");
            }
        }
        
        // Calculate fee
        uint256 feeAmount = (_amount * WITHDRAWAL_FEE_PERCENTAGE) / 100;
        uint256 amountAfterFee = _amount - feeAmount;
        
        // Update jar balance and user's last withdrawal time
        jar.balance -= _amount;
        jar.lastWithdrawalTime[msg.sender] = block.timestamp;
        
        // Record the claim
        jarClaims[_jarId].push(Claim({
            claimer: msg.sender,
            amount: _amount,
            reason: _reason,
            timestamp: block.timestamp
        }));
        
        // Transfer tokens
        if (jar.tokenAddress == address(0)) {
            // ETH jar
            (bool feeSuccess, ) = payable(feeRecipient).call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");
            
            (bool success, ) = payable(msg.sender).call{value: amountAfterFee}("");
            require(success, "Transfer failed");
        } else {
            // ERC20 jar
            IERC20 token = IERC20(jar.tokenAddress);
            token.transfer(feeRecipient, feeAmount);
            token.transfer(msg.sender, amountAfterFee);
        }
        
        emit WithdrawalMade(_jarId, msg.sender, _amount, _reason);
    }

    // Check if a user can withdraw
    function canUserWithdraw(uint256 _jarId, address _user) public view returns (bool) {
        if (!jars[_jarId].isActive) return false;
        if (jars[_jarId].blacklist[_user]) return false;
        
        // Check cooldown if applicable
        if (jars[_jarId].cooldownPeriod > 0) {
            uint256 lastWithdrawal = jars[_jarId].lastWithdrawalTime[_user];
            if (lastWithdrawal > 0 && block.timestamp < lastWithdrawal + jars[_jarId].cooldownPeriod) {
                return false;
            }
        }
        
        // Check access control
        AccessControlType accessType = jars[_jarId].accessControlType;
        
        if (accessType == AccessControlType.Open) {
            return true;
        } else if (accessType == AccessControlType.Whitelist) {
            return jars[_jarId].whitelist[_user] || jars[_jarId].admins[_user];
        } else if (accessType == AccessControlType.ERC20Gated) {
            IERC20 token = IERC20(jars[_jarId].gatingTokenAddress);
            return token.balanceOf(_user) >= jars[_jarId].gatingTokenAmount || jars[_jarId].admins[_user];
        } else if (accessType == AccessControlType.NFTGated) {
            IERC721 nft = IERC721(jars[_jarId].gatingTokenAddress);
            return nft.balanceOf(_user) > 0 || jars[_jarId].admins[_user];
        }
        
        return false;
    }

    // Get time until next withdrawal is allowed
    function getTimeUntilNextWithdrawal(uint256 _jarId, address _user) external view returns (uint256) {
        if (!jars[_jarId].isActive) return 0;
        if (jars[_jarId].cooldownPeriod == 0) return 0;
        
        uint256 lastWithdrawal = jars[_jarId].lastWithdrawalTime[_user];
        if (lastWithdrawal == 0) return 0;
        
        uint256 nextAllowedTime = lastWithdrawal + jars[_jarId].cooldownPeriod;
        if (block.timestamp >= nextAllowedTime) return 0;
        
        return nextAllowedTime - block.timestamp;
    }

    // Admin: Update jar parameters
    function updateJarParameters(
        uint256 _jarId,
        string memory _title,
        string memory _description,
        uint256 _maxWithdrawalAmount,
        uint256 _cooldownPeriod
    ) external jarExists(_jarId) onlyJarAdmin(_jarId) {
        require(bytes(_title).length > 0, "Title is required");
        require(bytes(_description).length > 0, "Description is required");
        
        Jar storage jar = jars[_jarId];
        jar.title = _title;
        jar.description = _description;
        jar.maxWithdrawalAmount = _maxWithdrawalAmount;
        jar.cooldownPeriod = _cooldownPeriod;
    }

    // Admin: Add user to whitelist
    function addToWhitelist(uint256 _jarId, address _user) external jarExists(_jarId) onlyJarAdmin(_jarId) {
        require(_user != address(0), "Invalid address");
        jars[_jarId].whitelist[_user] = true;
        emit UserWhitelisted(_jarId, _user);
    }

    // Admin: Remove user from whitelist
    function removeFromWhitelist(uint256 _jarId, address _user) external jarExists(_jarId) onlyJarAdmin(_jarId) {
        jars[_jarId].whitelist[_user] = false;
    }

    // Admin: Add user to blacklist
    function addToBlacklist(uint256 _jarId, address _user) external jarExists(_jarId) onlyJarAdmin(_jarId) {
        require(_user != address(0), "Invalid address");
        jars[_jarId].blacklist[_user] = true;
        emit UserBlacklisted(_jarId, _user);
    }

    // Admin: Remove user from blacklist
    function removeFromBlacklist(uint256 _jarId, address _user) external jarExists(_jarId) onlyJarAdmin(_jarId) {
        jars[_jarId].blacklist[_user] = false;
    }

    // Admin: Add another admin
    function addAdmin(uint256 _jarId, address _admin) external jarExists(_jarId) onlyJarAdmin(_jarId) {
        require(_admin != address(0), "Invalid address");
        jars[_jarId].admins[_admin] = true;
        emit AdminAdded(_jarId, _admin);
    }

    // Admin: Remove an admin
    function removeAdmin(uint256 _jarId, address _admin) external jarExists(_jarId) onlyJarAdmin(_jarId) {
        require(_admin != msg.sender, "Cannot remove yourself");
        jars[_jarId].admins[_admin] = false;
        emit AdminRemoved(_jarId, _admin);
    }

    // Admin: Emergency withdraw all funds
    function emergencyWithdraw(uint256 _jarId, address _recipient) external jarExists(_jarId) onlyJarAdmin(_jarId) nonReentrant {
        require(_recipient != address(0), "Invalid recipient");
        
        Jar storage jar = jars[_jarId];
        uint256 amount = jar.balance;
        require(amount > 0, "No funds to withdraw");
        
        jar.balance = 0;
        
        if (jar.tokenAddress == address(0)) {
            // ETH jar
            (bool success, ) = payable(_recipient).call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            // ERC20 jar
            IERC20 token = IERC20(jar.tokenAddress);
            token.transfer(_recipient, amount);
        }
        
        emit EmergencyWithdrawal(_jarId, msg.sender, amount);
    }

    // Admin: Delete jar
    function deleteJar(uint256 _jarId) external jarExists(_jarId) onlyJarAdmin(_jarId) {
        jars[_jarId].isActive = false;
        emit JarDeleted(_jarId);
    }

    // View: Check if user is admin
    function isUserAdmin(uint256 _jarId, address _user) external view returns (bool) {
        return jars[_jarId].admins[_user];
    }

    // View: Check if user is whitelisted
    function isUserWhitelisted(uint256 _jarId, address _user) external view returns (bool) {
        return jars[_jarId].whitelist[_user];
    }

    // View: Check if user is blacklisted
    function isUserBlacklisted(uint256 _jarId, address _user) external view returns (bool) {
        return jars[_jarId].blacklist[_user];
    }

    // View: Get jar details
    function getJarDetails(uint256 _jarId) external view returns (
        string memory title,
        string memory description,
        address creator,
        address tokenAddress,
        uint256 balance,
        uint256 maxWithdrawalAmount,
        uint256 cooldownPeriod,
        bool isActive,
        AccessControlType accessControlType
    ) {
        Jar storage jar = jars[_jarId];
        return (
            jar.title,
            jar.description,
            jar.creator,
            jar.tokenAddress,
            jar.balance,
            jar.maxWithdrawalAmount,
            jar.cooldownPeriod,
            jar.isActive,
            jar.accessControlType
        );
    }

    // View: Get number of claims for a jar
    function getJarClaimsCount(uint256 _jarId) external view returns (uint256) {
        return jarClaims[_jarId].length;
    }

    // View: Get claim details
    function getJarClaim(uint256 _jarId, uint256 _claimIndex) external view returns (
        address claimer,
        uint256 amount,
        string memory reason,
        uint256 timestamp
    ) {
        require(_claimIndex < jarClaims[_jarId].length, "Claim index out of bounds");
        Claim memory claim = jarClaims[_jarId][_claimIndex];
        return (claim.claimer, claim.amount, claim.reason, claim.timestamp);
    }
}