const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

const isBigIntInfinity = (value) => {
  return value === MAX_UINT256
}

module.exports = { isBigIntInfinity }
