import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { useGetProposersQuery } from '@/store/api/gateway'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { toChecksumAddress } from '@/utils/rsk-utils'
import useChainId from '@/hooks/useChainId'

const useProposers = () => {
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()

  return useGetProposersQuery(chainId && safeAddress ? { chainId, safeAddress } : skipToken)
}

export const useIsWalletProposer = () => {
  const wallet = useWallet()
  const proposers = useProposers()
  const chainId = useChainId()

  return proposers.data?.results.some(
    (proposer) => proposer.delegate === toChecksumAddress(wallet?.address || '', chainId),
  )
}

export default useProposers
