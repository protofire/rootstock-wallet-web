import { selectUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import { getUndeployedSafeInfo } from '@/features/counterfactual/utils'
import { useAppSelector } from '@/store'
import { useEffect, useMemo } from 'react'
import { getSafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useChainId } from '../useChainId'
import useIntervalCounter from '../useIntervalCounter'
import { Errors, logError } from '@/services/exceptions'
import { POLLING_INTERVAL } from '@/config/constants'
import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { useCurrentChain } from '../useChains'
import { useSafeAddressFromUrl } from '../useSafeAddressFromUrl'
import useSafeInfo from '../useSafeInfo'

export const useLoadSafeInfo = (): AsyncResult<SafeState> => {
  const address = useSafeAddressFromUrl()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const [pollCount, resetPolling] = useIntervalCounter(POLLING_INTERVAL)
  const { safe } = useSafeInfo()
  const isStoredSafeValid = safe.chainId === chainId && sameAddress(safe.address.value, checksumAddress(address))
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, chainId, checksumAddress(address)))

  const [undeployedData, undeployedError] = useAsync<SafeState | undefined>(async () => {
    if (!undeployedSafe || !chain) return
    /**
     * This is the one place where we can't check for `safe.deployed` as we want to update that value
     * when the local storage is cleared, so we have to check undeployedSafe
     */
    return getUndeployedSafeInfo(undeployedSafe, checksumAddress(address), chain)
  }, [undeployedSafe, address, chain])

  const [cgwData, cgwError, cgwLoading] = useAsync<SafeState | undefined>(async () => {
    if (!chainId || !address || pollCount === undefined) return
    const safeInfo = await getSafeInfo(chainId, checksumAddress(address))
    return { ...safeInfo, deployed: true }
  }, [chainId, address, pollCount])

  // Reset the counter when safe address/chainId changes
  useEffect(() => {
    resetPolling()
  }, [resetPolling, address, chainId])

  // Log errors
  useEffect(() => {
    if (cgwError) {
      logError(Errors._600, cgwError.message)
    }
  }, [cgwError])

  // Return stored SafeInfo between polls
  const safeData = cgwData ?? (isStoredSafeValid ? safe : undeployedData)
  const error = cgwError ?? (undeployedSafe ? undeployedError : undefined)
  const loading = cgwLoading

  return useMemo(() => [safeData, error, loading], [safeData, error, loading])
}

export default useLoadSafeInfo
