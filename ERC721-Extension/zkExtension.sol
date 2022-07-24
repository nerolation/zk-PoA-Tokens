// SPDX-License-Identifier: MIT

pragma solidity 0.8.8;

import "./verifier.sol";
import "./ERC721.sol";

contract zkExtension is ERC721 {
    bytes32 public _root;
    Verifier public _verifier;
    mapping(bytes32 => bool) public _nullifierHashes;
    uint256 private _tokenId;

	constructor(
        string memory name_, 
        string memory symbol_, 
        bytes32 root_,
        Verifier verifier_
        )
        ERC721(name_, symbol_)
    {   
      _root = root_;
      _verifier = verifier_;
    }

  function root() public view virtual returns (bytes32) {
    return _root;
  }

  // @notice mints PoA to address if nullifierHash is unknown
  // Returns true for valid proofs
  function verify(uint[2] memory a_,
                  uint[2][2] memory b_,
                  uint[2] memory c_,
                  uint[3] memory input_,
                  bytes32 root_,
                  bytes32 nullifierHash_,
                  address recipient_) public returns (bool valid) 
      {
        // Check if right tree
        require(root_ == _root, "Wrong root");
        if (_verifier.verifyProof(a_,b_,c_,input_)) {
            if (!_nullifierHashes[nullifierHash_]) {
              _nullifierHashes[nullifierHash_] = true;
              _mint(recipient_, _tokenId);
              _tokenId += 1;
            }
            return true;
        }
        return false;
      }
}

