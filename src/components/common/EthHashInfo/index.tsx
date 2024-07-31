import { type ReactElement, useMemo } from 'react'
import { useChain } from '@/hooks/useChains'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import { getBlockExplorerLink } from '@/utils/chains'
import SrcEthHashInfo, { type EthHashInfoProps } from './SrcEthHashInfo'
import { toChecksumAddress } from '@/utils/rsk-utils'

const EthHashInfo = ({
  showName = true,
  avatarSize = 40,
  ...props
}: EthHashInfoProps & { showName?: boolean }): ReactElement => {
  const settings = useAppSelector(selectSettings)
  const currentChainId = useChainId()
  const chain = useChain(props.chainId || currentChainId)
  const addressBooks = useAllAddressBooks()
  const address = useMemo(() => toChecksumAddress(props.address, currentChainId), [props.address, currentChainId])
  const link = chain && props.hasExplorer ? getBlockExplorerLink(chain, address) : undefined
  const name = showName && chain ? addressBooks?.[chain.chainId]?.[address] || props.name : undefined
  // const link = chain && props.hasExplorer ? getBlockExplorerLink(chain, props.address) : undefined
  // const addressBookName = chain ? addressBooks?.[chain.chainId]?.[props.address] : undefined
  // const name = showName ? addressBookName || props.name : undefined

  return (
    <SrcEthHashInfo
      prefix={chain?.shortName}
      copyPrefix={settings.shortName.copy}
      {...props}
      address={address}
      name={name}
      isAddressBookName={!!name}
      customAvatar={props.customAvatar}
      ExplorerButtonProps={{ title: link?.title || '', href: link?.href || '' }}
      avatarSize={avatarSize}
    >
      {props.children}
    </SrcEthHashInfo>
  )
}

export default EthHashInfo
