import FilteredSafes from '../FilteredSafes'
import PinnedSafes from '../PinnedSafes'
import CurrentSafe from '../CurrentSafe'
import ConnectWalletPrompt from '../ConnectWalletPrompt'
import SafesList from '../SafesList'
import { type AllSafeItems, type AllSafeItemsGrouped, getComparator, isMultiChainSafeItem } from '@/hooks/safes'
import SafeSelectionModal from '../SafeSelectionModal'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import useSafeSelectionModal from '../../hooks/useSafeSelectionModal'
import useWallet from '@/hooks/wallets/useWallet'
import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'

const AccountsList = ({
  searchQuery,
  safes,
  onLinkClick,
}: {
  searchQuery: string
  safes: AllSafeItemsGrouped
  onLinkClick?: () => void
  isSidebar?: boolean
}) => {
  const wallet = useWallet()
  const isConnected = Boolean(wallet)

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  // Safe selection modal hook
  const modal = useSafeSelectionModal()

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  // Non-pinned safes — owned safes returned by the gateway that the user hasn't manually pinned.
  // Surfaced in the "Accounts" section so wallets connected on RSK don't have to click "Add Safes"
  // before seeing their existing Safes (matches legacy rootstock-stg UX).
  const nonPinnedSafes = useMemo<AllSafeItems>(
    () =>
      allSafes.filter((item) =>
        isMultiChainSafeItem(item) ? !item.safes.some((s) => s.isPinned) : !item.isPinned,
      ),
    [allSafes],
  )

  if (searchQuery) {
    return <FilteredSafes searchQuery={searchQuery} allSafes={allSafes} onLinkClick={onLinkClick} />
  }

  // Show connect wallet prompt only when not connected AND no safes (pinned or otherwise) to display
  if (!isConnected && allSafes.length === 0) {
    return <ConnectWalletPrompt />
  }

  return (
    <>
      <CurrentSafe allSafes={allSafes} onLinkClick={onLinkClick} />
      <PinnedSafes allSafes={allSafes} onLinkClick={onLinkClick} onOpenSelectionModal={modal.open} />

      {nonPinnedSafes.length > 0 && (
        <Box data-testid="all-accounts" mb={2}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Accounts ({nonPinnedSafes.length})
          </Typography>
          <SafesList safes={nonPinnedSafes} onLinkClick={onLinkClick} />
        </Box>
      )}

      {allSafes.length === 0 && (
        <Typography data-testid="empty-safe-list" color="text.secondary" variant="body2" textAlign="center" py={3}>
          You don&apos;t have any safes yet
        </Typography>
      )}

      {/* Safe selection modal - kept available via Manage trusted Safes */}
      <SafeSelectionModal modal={modal} />
    </>
  )
}

export default AccountsList
