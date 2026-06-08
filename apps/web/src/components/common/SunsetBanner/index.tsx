import { type ReactElement } from 'react'
import { Typography } from '@mui/material'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import ExternalLink from '@/components/common/ExternalLink'

const WarningBanner = (): ReactElement | null => {
  const isWarningBannerEnabled = useHasFeature(FEATURES.WARNING_BANNER)

  if (!isWarningBannerEnabled) return null

  return (
    <ErrorMessage level="warning" title="Scheduled Maintenance — Transaction Service Migration">
      <Typography variant="body2">
        Due to a known bug in the RSK node&#39;s tracing implementation (
        <ExternalLink href="https://github.com/rsksmart/rskj/issues/3543" noIcon>
          https://github.com/rsksmart/rskj/issues/3543
        </ExternalLink>
        ) that prevents us from indexing the network properly, we are switching to an event-based indexing mechanism. As
        a result, queued transactions will be lost and will need to be recreated, and Safes created with older contract
        versions (1.1.1 and 1.2.0) may not be recognized by the interface. If you are unable to load your Safe, please
        reach out to our support team at{' '}
        <ExternalLink href="https://safe-support.protofire.io" noIcon>
          https://safe-support.protofire.io
        </ExternalLink>
        . We apologize for the inconvenience and thank you for your patience.
      </Typography>
    </ErrorMessage>
  )
}

export default WarningBanner
