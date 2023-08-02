import * as React from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'
import { isAddress } from '@/utils/rsk-utils'
import { shortenAddress } from '@/utils/formatters'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import Identicon from '@/components/common/Identicon'

import type { EthHashInfoProps } from '@safe-global/safe-react-components'
import { ExplorerButton } from '@safe-global/safe-react-components'

export const EthHashInfo = ({
  address,
  customAvatar,
  prefix = '',
  copyPrefix,
  showPrefix,
  shortAddress = true,
  showAvatar = true,
  avatarSize,
  name,
  showCopyButton,
  hasExplorer,
  ExplorerButtonProps,
  children,
}: EthHashInfoProps): React.ReactElement => {
  const [fallbackToIdenticon, setFallbackToIdenticon] = React.useState(false)
  const shouldPrefix = isAddress(address)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const onError = React.useCallback(() => {
    setFallbackToIdenticon(true)
  }, [])

  return (
    <Container>
      {showAvatar && (
        <AvatarContainer size={avatarSize}>
          {!fallbackToIdenticon && customAvatar ? (
            <img src={customAvatar} alt={address} onError={onError} width={avatarSize} height={avatarSize} />
          ) : (
            <Identicon address={address} size={avatarSize} />
          )}
        </AvatarContainer>
      )}

      <Box overflow="hidden">
        {name && (
          <Box sx={{ fontSize: '14px' }} textOverflow="ellipsis" overflow="hidden" title={name}>
            {name}
          </Box>
        )}

        <AddressContainer>
          <Box fontWeight="inherit" fontSize="inherit">
            {showPrefix && shouldPrefix && prefix && <b>{prefix}:</b>}
            <span>{shortAddress || isMobile ? shortenAddress(address) : address}</span>
          </Box>

          {showCopyButton && (
            <CopyAddressButton prefix={prefix} address={address} copyPrefix={shouldPrefix && copyPrefix} />
          )}

          {hasExplorer && ExplorerButtonProps && <ExplorerButton {...ExplorerButtonProps} />}

          {children}
        </AddressContainer>
      </Box>
    </Container>
  )
}

const Container = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5em',
  lineHeight: 1.4,
})

const AvatarContainer = styled('div')<{ size?: number }>(({ size }) => ({
  flexShrink: 0,
  width: size || '2.3em !important',
  height: size || '2.3em !important',
  '> *': {
    width: '100% !important',
    height: '100% !important',
  },
}))

const AddressContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '0.25em',
  whiteSpace: 'nowrap',
})
