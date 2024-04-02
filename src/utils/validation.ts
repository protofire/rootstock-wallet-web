import { parsePrefixedAddress, sameAddress, isChecksummedAddress } from './addresses'
import { safeFormatUnits, safeParseUnits } from './formatters'

export const validateAddress = (address: string, chainId?: string) => {
  const ADDRESS_RE = /^0x[0-9a-f]{40}$/i

  if (!ADDRESS_RE.test(address)) {
    return 'Invalid address format'
  }

  if (!isChecksummedAddress(address, chainId)) {
    return 'Invalid address checksum'
  }
}

export const isValidAddress = (address: string, chainId?: string): boolean =>
  validateAddress(address, chainId) === undefined

export const validatePrefixedAddress =
  (chainShortName?: string) =>
  (value: string, chainId?: string): string | undefined => {
    const { prefix, address } = parsePrefixedAddress(value, chainId)

    if (prefix) {
      if (prefix !== chainShortName) {
        return `"${prefix}" doesn't match the current chain`
      }
    }

    return validateAddress(address, chainId)
  }

export const uniqueAddress =
  (addresses: string[] = []) =>
  (address: string): string | undefined => {
    const ADDRESS_REPEATED_ERROR = 'Address already added'
    const addressExists = addresses.some((addressFromList) => sameAddress(addressFromList, address))
    return addressExists ? ADDRESS_REPEATED_ERROR : undefined
  }

export const addressIsNotCurrentSafe =
  (safeAddress: string) =>
  (address: string): string | undefined => {
    const SIGNER_ADDRESS_IS_SAFE_ADDRESS_ERROR = 'Cannot use Safe Account itself as signer.'
    return sameAddress(safeAddress, address) ? SIGNER_ADDRESS_IS_SAFE_ADDRESS_ERROR : undefined
  }

export const FLOAT_REGEX = /^[0-9]+([,.][0-9]+)?$/

export const validateAmount = (amount?: string, includingZero: boolean = false) => {
  if (!amount || isNaN(Number(amount))) {
    return 'The value must be a number'
  }

  if (includingZero ? parseFloat(amount) < 0 : parseFloat(amount) <= 0) {
    return 'The value must be greater than 0'
  }
}

export const validateLimitedAmount = (amount: string, decimals?: number, max?: string) => {
  if (typeof decimals === 'undefined' || !max) return

  const numberError = validateAmount(amount)
  if (numberError) {
    return numberError
  }

  const value = safeParseUnits(amount, decimals)

  if (value !== undefined && value > BigInt(max)) {
    return `Maximum value is ${safeFormatUnits(max, decimals)}`
  }
}

export const validateDecimalLength = (value: string, maxLen?: number, minLen = 1) => {
  if (typeof maxLen === 'undefined' || !value.includes('.')) {
    return
  }

  if (maxLen === 0) {
    return 'Should not have decimals'
  }

  const decimals = value.split('.')[1] || ''

  if (decimals.length < +minLen || decimals.length > +maxLen) {
    return `Should have ${minLen} to ${maxLen} decimals`
  }
}

export const isValidURL = (url: string, protocolsAllowed = ['https:']): boolean => {
  try {
    const urlInfo = new URL(url)

    return protocolsAllowed.includes(urlInfo.protocol) || urlInfo.hostname.split('.').pop() === 'localhost'
  } catch (error) {
    return false
  }
}
