import { keccak, stripHexPrefix } from 'ethereumjs-util'

export function isAddress(address: string) {
  return /^(0x)?[0-9a-fA-F]{40}$/.test(address)
}

/**
 * @description Implements EIP-1191 Address Checksum
 * @param {String} _address
 * @param {Integer|String} _chainId
 * @returns {String} checksummed address
 */
export function toChecksumAddress(_address: string, _chainId: string = '') {
  const address = stripHexPrefix(_address).toLowerCase()
  const chainId = parseInt(_chainId)
  const prefix = !isNaN(chainId) ? `${chainId.toString()}0x` : ''
  const hash = keccak(Buffer.from(`${prefix}${address}`)).toString('hex')
  return (
    '0x' +
    address
      .split('')
      .map((b, i) => (parseInt(hash[i], 16) >= 8 ? b.toUpperCase() : b))
      .join('')
  )
}
