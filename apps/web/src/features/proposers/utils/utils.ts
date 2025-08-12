import { signTypedData } from '@safe-global/utils/utils/web3'
import { SigningMethod } from '@safe-global/protocol-kit'
import { adjustVInSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import type { JsonRpcSigner } from 'ethers'
import { toChecksumAddress } from '@/utils/rsk-utils'
import type { TypedData, TypedDataDomain } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

const getProposerDataV2 = (chainId: string, proposerAddress: string): TypedData => {
  const totp = Math.floor(Date.now() / 1000 / 3600)

  // For Rootstock, use the address in lowercase
  const checksummedAddress =
    chainId === '30' || chainId === '31' ? proposerAddress.toLowerCase() : toChecksumAddress(proposerAddress, chainId)

  const domain = {
    name: 'Safe Transaction Service',
    version: '1.0',
    chainId: Number(chainId),
  } as TypedDataDomain

  const types = {
    Delegate: [
      { name: 'delegateAddress', type: 'address' },
      { name: 'totp', type: 'uint256' },
    ],
  }

  const message = {
    delegateAddress: checksummedAddress,
    totp,
  }

  return {
    domain,
    types,
    message,
    primaryType: 'Delegate' as const,
  }
}

export const signProposerTypedData = async (chainId: string, proposerAddress: string, signer: JsonRpcSigner) => {
  const typedData = getProposerDataV2(chainId, proposerAddress)
  return signTypedData(signer, typedData)
}

const getProposerDataV1 = (proposerAddress: string, chainId: string) => {
  const totp = Math.floor(Date.now() / 1000 / 3600)

  // For Rootstock, use the address in lowercase
  const checksummedAddress =
    chainId === '30' || chainId === '31' ? proposerAddress.toLowerCase() : toChecksumAddress(proposerAddress, chainId)

  return `${checksummedAddress}${totp}`
}

export const signProposerData = async (proposerAddress: string, signer: JsonRpcSigner, chainId: string) => {
  const data = getProposerDataV1(proposerAddress, chainId)

  const signature = await signer.signMessage(data)

  return adjustVInSignature(SigningMethod.ETH_SIGN_TYPED_DATA, signature)
}
