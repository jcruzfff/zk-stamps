// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ZKStampsPOAP
 * @dev Contract for minting POAPs (Proof of Attendance Protocol) for travel
 * that works with the zkStamps application
 */
contract ZKStampsPOAP is ERC721Enumerable, Ownable {
    using Strings for uint256;

    // Base URI for metadata
    string private _baseTokenURI;
    
    // Structure to store POAP data
    struct POAPData {
        string countryCode;
        string countryName;
        string coordinates;
        uint256 timestamp;
        address minter;
    }
    
    // Mapping from token ID to POAP data
    mapping(uint256 => POAPData) private _poapData;
    
    // Mapping to track which countries an address has visited
    // address -> countryCode -> hasVisited
    mapping(address => mapping(string => bool)) private _countryVisits;
    
    // Array of all countries visited by all users
    string[] private _allCountries;
    
    // Mapping to check if a country has been added to the _allCountries array
    mapping(string => bool) private _countryExists;
    
    // Events
    event POAPMinted(
        address indexed to, 
        uint256 indexed tokenId, 
        string countryCode, 
        string countryName, 
        string coordinates
    );

    /**
     * @dev Constructor
     * @param name Name of the token
     * @param symbol Symbol of the token
     * @param baseURI Base URI for token metadata
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) Ownable() {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Set the base URI for all token metadata
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Base URI for metadata
     * @return string Base URI string
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Get POAP data for a token
     * @param tokenId Token ID
     * @return countryCode Country code
     * @return countryName Full country name
     * @return coordinates Coordinates string
     * @return timestamp Timestamp of minting
     * @return minter Address of who minted the token
     */
    function getPOAPData(uint256 tokenId) external view returns (
        string memory countryCode, 
        string memory countryName, 
        string memory coordinates, 
        uint256 timestamp,
        address minter
    ) {
        require(_exists(tokenId), "ZKStampsPOAP: Query for nonexistent token");
        
        POAPData memory data = _poapData[tokenId];
        return (
            data.countryCode, 
            data.countryName, 
            data.coordinates, 
            data.timestamp,
            data.minter
        );
    }
    
    /**
     * @dev Check if an address has visited a country
     * @param owner Owner address to check
     * @param countryCode ISO country code to check
     * @return bool True if the owner has visited the country
     */
    function hasVisitedCountry(address owner, string memory countryCode) public view returns (bool) {
        return _countryVisits[owner][countryCode];
    }
    
    /**
     * @dev Get all countries visited by a user
     * @param user User address
     * @return string[] Array of country codes visited
     */
    function getCountriesVisitedByUser(address user) external view returns (string[] memory) {
        uint256 count = 0;
        
        // Count how many countries the user has visited
        for (uint256 i = 0; i < _allCountries.length; i++) {
            if (_countryVisits[user][_allCountries[i]]) {
                count++;
            }
        }
        
        // Create array of visited countries
        string[] memory visited = new string[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _allCountries.length; i++) {
            if (_countryVisits[user][_allCountries[i]]) {
                visited[index] = _allCountries[i];
                index++;
            }
        }
        
        return visited;
    }
    
    /**
     * @dev Get all countries in the system
     * @return string[] Array of all country codes
     */
    function getAllCountries() external view returns (string[] memory) {
        return _allCountries;
    }
    
    /**
     * @dev Mint a new POAP
     * @param countryCode ISO country code (e.g., "US")
     * @param countryName Full country name (e.g., "United States")
     * @param coordinates GPS coordinates as string (e.g., "37.7749,-122.4194")
     * @return uint256 The ID of the minted token
     */
    function mintPOAP(
        string memory countryCode,
        string memory countryName,
        string memory coordinates
    ) external returns (uint256) {
        uint256 tokenId = totalSupply() + 1;
        
        // Mint the token to the sender
        _mint(msg.sender, tokenId);
        
        // Store POAP data
        _poapData[tokenId] = POAPData({
            countryCode: countryCode,
            countryName: countryName,
            coordinates: coordinates,
            timestamp: block.timestamp,
            minter: msg.sender
        });
        
        // Mark this country as visited by the sender
        _countryVisits[msg.sender][countryCode] = true;
        
        // Add country to the list of all countries if it's not already there
        if (!_countryExists[countryCode]) {
            _allCountries.push(countryCode);
            _countryExists[countryCode] = true;
        }
        
        // Emit event
        emit POAPMinted(msg.sender, tokenId, countryCode, countryName, coordinates);
        
        return tokenId;
    }
    
    /**
     * @dev Admin function to mint a POAP for another address
     * @param to Address to mint the POAP to
     * @param countryCode ISO country code
     * @param countryName Full country name
     * @param coordinates GPS coordinates as string
     * @return uint256 The ID of the minted token
     */
    function adminMintPOAP(
        address to,
        string memory countryCode,
        string memory countryName,
        string memory coordinates
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = totalSupply() + 1;
        
        // Mint the token to the specified address
        _mint(to, tokenId);
        
        // Store POAP data
        _poapData[tokenId] = POAPData({
            countryCode: countryCode,
            countryName: countryName,
            coordinates: coordinates,
            timestamp: block.timestamp,
            minter: to
        });
        
        // Mark this country as visited by the recipient
        _countryVisits[to][countryCode] = true;
        
        // Add country to the list of all countries if it's not already there
        if (!_countryExists[countryCode]) {
            _allCountries.push(countryCode);
            _countryExists[countryCode] = true;
        }
        
        // Emit event
        emit POAPMinted(to, tokenId, countryCode, countryName, coordinates);
        
        return tokenId;
    }
} 