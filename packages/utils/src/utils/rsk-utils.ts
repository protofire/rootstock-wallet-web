import { keccak256, toUtf8Bytes } from 'ethers'

export const RSK_CHAIN_IDS = ['30', '31'] as const

export const isRskChain = (chainId?: string | number): boolean => {
  if (chainId === undefined || chainId === null) return false
  return RSK_CHAIN_IDS.includes(String(chainId) as (typeof RSK_CHAIN_IDS)[number])
}

/**
 * EIP-1191 checksum (chain-id-aware). When `chainId` is omitted or NaN, this
 * degenerates to standard EIP-55 — making it a drop-in replacement for ethers'
 * `getAddress`.
 */
export const toEip1191ChecksumAddress = (address: string, chainId?: string | number): string => {
  const cleaned = address.toLowerCase().replace(/^0x/, '')
  const numericChainId = chainId === undefined ? NaN : parseInt(String(chainId), 10)
  const prefix = Number.isNaN(numericChainId) ? '' : `${numericChainId}0x`
  const hash = keccak256(toUtf8Bytes(`${prefix}${cleaned}`)).replace(/^0x/, '')

  let out = '0x'
  for (let i = 0; i < cleaned.length; i++) {
    out += parseInt(hash[i], 16) >= 8 ? cleaned[i].toUpperCase() : cleaned[i]
  }
  return out
}

/**
 * Checks whether `address` matches the EIP-1191 checksum form for any of the
 * supported RSK chain IDs. RSK wallets (MetaMask + RSK plugin, RIF Wallet, etc.)
 * return addresses in EIP-1191 form; this lets the regular Safe address
 * validators accept them without breaking EIP-55 typo protection on other chains.
 */
export const isRskChecksummedAddress = (address: string): boolean => {
  return RSK_CHAIN_IDS.some((id) => toEip1191ChecksumAddress(address, id) === address)
}
