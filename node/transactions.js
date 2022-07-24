const assert = require('assert')
const crypto = require('crypto')
const ethers = require('ethers')
const { mimcHash } = require('./mimc');
const circomlib = require('circomlib')
const MerkleTree = require('fixed-merkle-tree')
const leBuff2int = require("ffjavascript").utils.leBuff2int;

/** Generate random number of specified byte length */
const rbigint = nbytes => leBuff2int(crypto.randomBytes(nbytes))

/** Compute pedersen hash */
const pedersenHash = data => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0]

const mimcsponge = circomlib.mimcsponge

/** BigNumber to hex string of specified length */
function toHex(number, length = 32) {
  const str = number instanceof Buffer ? number.toString('hex') : BigInt(number).toString(16)
  return '0x' + str.padStart(length * 2, '0')
}

/**
 * Create deposit object from secret and nullifier
 */
function createDeposit({ nullifier, secret }) {
  const preimage = Buffer.concat([nullifier.leInt2Buff(31), secret.leInt2Buff(31)])
  const commitment = pedersenHash(preimage)
  const commitmentHex = toHex(commitment)
  const nullifierHash = pedersenHash(nullifier.leInt2Buff(31))
  const nullifierHex = toHex(nullifierHash).toString()
  return { nullifier, secret, preimage, commitment, commitmentHex, nullifierHash, nullifierHex }
}
console.log(rbigint(31));
note = createDeposit({
        nullifier: 70468531690246127597324659426162022323359627919521679359003215289346912273n,
        secret: 60468531690246127597324659426162022323359627919521679359003215289346912273n,
      })


console.log(note)

const my_commitment = note.commitment
const my_recipient = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"

// Merkle tree
const merkleTreeLevels = 1;
const merkleTreeCommitments = [my_commitment,my_commitment];


const getPath = address => {
  const merkleTree = new MerkleTree(merkleTreeLevels, 
                                    merkleTreeCommitments, 
                                  { hashFunction: mimcHash(123) });
  let index = merkleTreeCommitments.findIndex(leaf => leaf === address);
  if(index < 0) return null;
  const { pathElements, pathIndices } = merkleTree.path(index);
  return [merkleTree.root(), pathElements, pathIndices];
};


function Uint8Array_to_bigint(x) {
  var ret = 0n;
  for (var idx = 0; idx < x.length; idx++) {
    ret = ret * 256n;
    ret = ret + BigInt(x[idx]);
  }
  return ret;
}

const fromHexString = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const intToHex = intString => ethers.BigNumber.from(intString).toHexString();
const hexStringTobigInt = hexString => {
  return Uint8Array_to_bigint(fromHexString(hexString));
};

function generateProofInputs(secret) {
  const val = getPath(secret);
  if (!val) return null;
  const [root, pathElements, pathIndices] = val;
  console.log("Hex root:", intToHex(root.toString()));
  const input = {
    root: root.toString(),
    nullifierHash: note.nullifierHash.toString(),
    pathElements: pathElements.map(x => x.toString()),
    pathIndices: pathIndices,
    secret: note.secret.toString(),
    nullifier: note.nullifier.toString(),
    recipient: hexStringTobigInt(my_recipient).toString()
  };

  return input;
}

var commitment = my_commitment;
var inputs = generateProofInputs(commitment);
console.log("Inputs:",JSON.stringify(inputs));