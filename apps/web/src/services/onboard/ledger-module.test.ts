import { Transaction } from 'ethers'
import { getLedgerTransactionFeeParams } from './ledger-module'

const ROOTSTOCK_MAINNET_CHAIN_ID = 30n
const ETHEREUM_CHAIN_ID = 1n

// Build a transaction exactly as the Ledger module's eth_signTransaction handler does, so the
// assertions exercise the real fee/type logic rather than a copy of it.
const buildTx = (chainId: bigint, txParams: Parameters<typeof getLedgerTransactionFeeParams>[0]) =>
  Transaction.from({
    ...getLedgerTransactionFeeParams(txParams),
    chainId,
    to: '0xBD0c770Fb60A196F1C29b437F8c28a0fA753Cac2',
    value: 0n,
    data: '0x',
    nonce: 9,
    gasLimit: 100_000n,
  })

describe('getLedgerTransactionFeeParams', () => {
  it('produces a legacy (type 0) transaction for a gasPrice-only tx (Rootstock)', () => {
    // Rootstock is legacy-only; the Execute/creation flows pass gasPrice and no EIP-1559 fee caps.
    const tx = buildTx(ROOTSTOCK_MAINNET_CHAIN_ID, { gasPrice: 65_000_000n })

    expect(tx.type).toBe(0)
    // Legacy txs serialize as an RLP list (0xc0+); typed txs would start with 0x01 (EIP-2930) or
    // 0x02 (EIP-1559), which is exactly what Rootstock rejects with "Internal server error".
    expect(tx.unsignedSerialized.startsWith('0x01')).toBe(false)
    expect(tx.unsignedSerialized.startsWith('0x02')).toBe(false)
    expect(tx.gasPrice).toBe(65_000_000n)
    expect(tx.maxFeePerGas).toBeNull()
    expect(tx.maxPriorityFeePerGas).toBeNull()
  })

  it('does not leak EIP-1559 fee caps into a legacy tx even if a stray maxFeePerGas is absent', () => {
    const params = getLedgerTransactionFeeParams({ gasPrice: 1n })

    expect(params.type).toBe(0)
    expect(params.maxFeePerGas).toBeNull()
    expect(params.maxPriorityFeePerGas).toBeNull()
  })

  it('falls back to legacy (type 0) for degenerate single-cap or fee-less inputs (no throw)', () => {
    // A lone maxPriorityFeePerGas would otherwise make ethers throw "priorityFee cannot be more than maxFee".
    expect(getLedgerTransactionFeeParams({ maxPriorityFeePerGas: 1n }).type).toBe(0)
    expect(getLedgerTransactionFeeParams({ maxFeePerGas: 1n }).type).toBe(0)
    expect(getLedgerTransactionFeeParams({}).type).toBe(0)
    // The lone-priority-cap input must still build without throwing
    expect(() => buildTx(ROOTSTOCK_MAINNET_CHAIN_ID, { maxPriorityFeePerGas: 1n })).not.toThrow()
  })

  it('produces an EIP-1559 (type 2) transaction when fee caps are provided (EIP-1559 chains)', () => {
    const tx = buildTx(ETHEREUM_CHAIN_ID, { maxFeePerGas: 65_000_000n, maxPriorityFeePerGas: 1_000_000n })

    expect(tx.type).toBe(2)
    expect(tx.unsignedSerialized.startsWith('0x02')).toBe(true)
    expect(tx.maxFeePerGas).toBe(65_000_000n)
    expect(tx.maxPriorityFeePerGas).toBe(1_000_000n)
    expect(tx.gasPrice).toBeNull()
  })

  it('ignores gasPrice when EIP-1559 fee caps are present (no mixed legacy/1559 fields)', () => {
    const params = getLedgerTransactionFeeParams({
      gasPrice: 99n,
      maxFeePerGas: 65_000_000n,
      maxPriorityFeePerGas: 1_000_000n,
    })

    expect(params.type).toBe(2)
    expect(params.gasPrice).toBeNull()
  })

  it('accepts string-encoded fee values (as received from the EIP-1193 provider)', () => {
    const legacy = getLedgerTransactionFeeParams({ gasPrice: '0x3e9' })
    expect(legacy.type).toBe(0)
    expect(legacy.gasPrice).toBe(1001n)

    const eip1559 = getLedgerTransactionFeeParams({ maxFeePerGas: '0x3e9', maxPriorityFeePerGas: '0x1' })
    expect(eip1559.type).toBe(2)
    expect(eip1559.maxFeePerGas).toBe(1001n)
  })
})
