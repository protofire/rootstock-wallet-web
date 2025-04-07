import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { parsePrefixedAddress } from '@/utils/addresses'
import useChainId from '@/hooks/useChainId'

const useSafeAddress = (): string => {
  const router = useRouter()
  const chainId = useChainId()
  const { safe = '' } = router.query
  const fullAddress = Array.isArray(safe) ? safe[0] : safe

  const checksummedAddress = useMemo(() => {
    if (!fullAddress) return ''
    const { address } = parsePrefixedAddress(fullAddress, chainId)
    return address
  }, [fullAddress, chainId])

  return checksummedAddress
}

export default useSafeAddress
