import { type ReactElement } from 'react'
import { Typography } from '@mui/material'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useChainId from '@/hooks/useChainId'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { BANNERS } from '@/config/constants.extra'

const WarningBanner = (): ReactElement | null => {
  const chainId = useChainId()
  const isWarningBannerEnabled = useHasFeature(FEATURES.WARNING_BANNER)
  const banner = BANNERS[chainId]

  if (!isWarningBannerEnabled || !banner) return null

  return (
    <ErrorMessage level="warning" title={banner.title}>
      <Typography variant="body2">{banner.description}</Typography>
    </ErrorMessage>
  )
}

export default WarningBanner
