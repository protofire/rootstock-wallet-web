import { getAddress, isAddress } from 'ethers'
import { isRskChain, isRskChecksummedAddress, toEip1191ChecksumAddress } from './rsk-utils'

/**
 * Checksums the given address. When `chainId` is provided and corresponds to an
 * RSK network, EIP-1191 is used; otherwise standard EIP-55.
 * @param address ethereum address
 * @param chainId optional chain id to apply EIP-1191 (RSK) instead of EIP-55
 * @returns the checksummed address if the given address is valid otherwise returns the address unchanged
 */
export const checksumAddress = (address: string, chainId?: string | number): string => {
  if (!isAddress(address)) return address
  if (isRskChain(chainId)) return toEip1191ChecksumAddress(address, chainId)
  // Lowercase first so ethers' strict EIP-55 check doesn't throw on EIP-1191 (RSK) inputs.
  return getAddress(address.toLowerCase())
}

/**
 * Drop-in replacement for ethers' `getAddress` that tolerates non-EIP-55
 * mixed-case inputs (e.g. EIP-1191 from RSK wallets). Returns canonical EIP-55.
 * Throws (matching ethers' behavior) only when the input isn't a 40-hex address.
 */
export const safeGetAddress = (address: string): string => {
  return getAddress(address.toLowerCase())
}

export const isChecksummedAddress = (address: string): boolean => {
  if (!isAddress(address)) {
    return false
  }

  try {
    if (getAddress(address) === address) return true
  } catch {
    // fall through to RSK check
  }
  // Accept EIP-1191 RSK addresses so wallets returning chain-30/31 checksums pass validation.
  return isRskChecksummedAddress(address)
}

export const sameAddress = (firstAddress: string | undefined, secondAddress: string | undefined): boolean => {
  if (!firstAddress || !secondAddress) {
    return false
  }

  return firstAddress.toLowerCase() === secondAddress.toLowerCase()
}

export type PrefixedAddress = {
  prefix?: string
  address: string
}

/**
 * Parses a string that may/may not contain an address and returns the `prefix` and checksummed `address`
 * @param value (prefixed) address
 * @returns `prefix` and checksummed `address`
 */
export const parsePrefixedAddress = (value: string): PrefixedAddress => {
  let [prefix, address] = value.split(':')

  if (!address) {
    address = value
    prefix = ''
  }

  return {
    prefix: prefix || undefined,
    address: checksumAddress(address),
  }
}

export const formatPrefixedAddress = (address: string, prefix?: string): string => {
  return prefix ? `${prefix}:${address}` : address
}

export const cleanInputValue = (value: string): string => {
  const regex = /(?:([^\s:]+):)?(0x[a-f0-9]{40})\b/i
  const match = value.match(regex)
  // if match, return the address with optional prefix
  if (match) return match[0]

  // if no match, return the original value
  return value
}
