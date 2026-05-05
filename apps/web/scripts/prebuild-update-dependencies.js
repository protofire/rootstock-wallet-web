import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const templateId = process.env.TEMPLATE_ID || 'default'

const isProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION || false
const gatewayURL =
  isProduction === 'true' ? process.env.NEXT_PUBLIC_GATEWAY_URL_PRODUCTION : process.env.NEXT_PUBLIC_GATEWAY_URL_STAGING

const NETWORK_FOLDER = '../../node_modules/safe-network-config/networks'

const FALLBACK_FOLDER = 'default'

const SAFE_DEPLOYMENT_PACKAGE_NAME = '@safe-global/safe-deployments'

const CONTRACTS = {
  '1.3.0': [
    'compatibility_fallback_handler.json',
    'create_call.json',
    'gnosis_safe.json',
    'gnosis_safe_l2.json',
    'multi_send.json',
    'multi_send_call_only.json',
    'proxy_factory.json',
    'sign_message_lib.json',
    'simulate_tx_accessor.json',
  ],
  '1.4.1': [
    'compatibility_fallback_handler.json',
    'create_call.json',
    'multi_send.json',
    'multi_send_call_only.json',
    'safe.json',
    'safe_l2.json',
    'safe_migration.json',
    'safe_proxy_factory.json',
    'safe_to_l2_migration.json',
    'safe_to_l2_setup.json',
    'sign_message_lib.json',
    'simulate_tx_accessor.json',
  ],
}

const DEFAULT_SAFE_DEPLOYMENTS = {
  '*': 'canonical',
  '1.3.0': ['eip155', 'canonical'],
}

const DEFAULT_ALLOWANCE_MODULES = {
  '0.1.0': '0xE46FE78DBfCa5E835667Ba9dCd3F3315E7623F8a',
  '0.1.1': '0xAA46724893dedD72658219405185Fb0Fc91e091C',
}

// Patch missing safe-deployments networkAddresses using override precedence rules.
async function patchDeployments(networkConfig, chainData) {
  for (const version of networkConfig.SUPPORTED_VERSIONS) {
    const contractsForVersion = CONTRACTS[version]

    if (!contractsForVersion) {
      throw new Error(
        `[PREBUILD-PATCH]: Unsupported Safe version "${version}". Add contract assets in CONTRACTS before using it in SUPPORTED_VERSIONS.`,
      )
    }

    for (const contract of contractsForVersion) {
      const SAFE_DEPLOYMENTS_ASSET_PATH = `${SAFE_DEPLOYMENT_PACKAGE_NAME}/dist/assets/v${version}/${contract}`
      const SAFE_DEPLOYMENTS_JSON_PATH = path.resolve(`../../node_modules`, SAFE_DEPLOYMENTS_ASSET_PATH)

      if (!fs.existsSync(SAFE_DEPLOYMENTS_JSON_PATH)) {
        throw new Error(`[PREBUILD-PATCH]: Dependency JSON not found: ${SAFE_DEPLOYMENTS_JSON_PATH}`)
      }

      const json = JSON.parse(fs.readFileSync(SAFE_DEPLOYMENTS_JSON_PATH, 'utf-8'))

      if (!json.networkAddresses) json.networkAddresses = {}
      let added = false

      for (let { chainId } of chainData) {
        chainId = chainId.toString()

        // Skip patching when networkConfig.SAFE_DEPLOYMENTS_OVERRIDE.<chain_id>.<version> === null
        if (networkConfig?.SAFE_DEPLOYMENTS_OVERRIDE?.[chainId]?.[version] === null) {
          continue
        }

        if (!(chainId in json.networkAddresses)) {
          json.networkAddresses[chainId] =
            // If networkConfig.SAFE_DEPLOYMENTS_OVERRIDE.<chain_id>.<version> is defined takes precedence
            networkConfig?.SAFE_DEPLOYMENTS_OVERRIDE?.[chainId]?.[version] ??
            // If networkConfig.SAFE_DEPLOYMENTS_OVERRIDE.<version> is defined (backward compatibility)
            networkConfig?.SAFE_DEPLOYMENTS_OVERRIDE?.[version] ??
            // If networkConfig.EIP155 === true
            (version === '1.3.0' && networkConfig.EIP155 ? 'eip155' : undefined) ??
            // Version default deployment type/s
            DEFAULT_SAFE_DEPLOYMENTS[version] ??
            // Fallback to canonical deployment for unknown versions
            DEFAULT_SAFE_DEPLOYMENTS['*']

          console.log(
            `[PREBUILD-PATCH]: Patched ${SAFE_DEPLOYMENTS_ASSET_PATH} for chain_id=${chainId} value=${json.networkAddresses[chainId]}`,
          )

          added = true
        }
      }

      if (added) {
        fs.writeFileSync(SAFE_DEPLOYMENTS_JSON_PATH, JSON.stringify(json, null, 2) + '\n', 'utf-8')
        console.log(`[PREBUILD-PATCH]: Updated ${SAFE_DEPLOYMENTS_ASSET_PATH} for template_id=${templateId}`)
      } else {
        console.log(`[PREBUILD-PATCH]: No values were overwritten for ${SAFE_DEPLOYMENTS_ASSET_PATH}`)
      }
    }
  }
}

// Since we still need to enable modules in config - we can safely add values for any chain
async function patchModules(networkConfig, chainData) {
  const MODULES = networkConfig.ALLOWANCE_MODULE_OVERRIDE ?? DEFAULT_ALLOWANCE_MODULES

  Object.entries(MODULES).forEach(([version, address]) => {
    const SAFE_MODULES_PATH = path.resolve(
      `../../node_modules/@safe-global/safe-modules-deployments/dist/assets/allowance-module/v${version}/allowance-module.json`,
    )
    if (!fs.existsSync(SAFE_MODULES_PATH))
      throw new Error(`[PREBUILD-PATCH]: Dependency JSON not found: ${SAFE_MODULES_PATH}`)

    const json = JSON.parse(fs.readFileSync(SAFE_MODULES_PATH, 'utf-8'))

    if (!json.networkAddresses) json.networkAddresses = {}
    let added = false

    chainData.forEach(({ chainId }) => {
      const key = chainId.toString()
      if (!(key in json.networkAddresses)) {
        json.networkAddresses[key] = address
        added = true
      }
    })

    if (added) {
      fs.writeFileSync(SAFE_MODULES_PATH, JSON.stringify(json, null, 2) + '\n', 'utf-8')
      console.log(`[PREBUILD-PATCH-MODULES]: Updated module with ${address} for ${templateId}.`)
    } else {
      console.log(`[PREBUILD-PATCH-MODULES]: No values were overwritten for v${version}-allowance-module.json`)
    }
  })
}

async function patchProtocolKit(chainData) {
  const SAFE_PROTOCOL_KIT_PATH = path.resolve(
    `../../node_modules/@safe-global/protocol-kit/dist/src/utils/eip-3770/config.js`,
  )

  const jsConfigText = fs.readFileSync(SAFE_PROTOCOL_KIT_PATH, 'utf-8')
  const match = jsConfigText.match(/exports\.networks\s*=\s*\[((.|\n)*?)\];/)

  if (!match) {
    throw new Error("Could not find exported 'networks' array")
  }

  const arrText = match[1]

  // TODO: fix this workaround
  let arr
  let added = false
  try {
    arr = eval(`[${arrText}]`)
  } catch (e) {
    throw new Error('Failed to parse array: ' + e.message)
  }

  chainData.forEach(({ chainId, shortName }) => {
    const newEntry = {
      chainId: BigInt(chainId),
      shortName: shortName,
    }

    const idx = arr.findIndex((item) => {
      const a = BigInt(item.chainId)
      const b = newEntry.chainId
      return a === b
    })

    if (idx === -1) {
      arr.push(newEntry)
      added = true
      console.log(`[PREBUILD-PATCH-PROTOCOL-KIT]: New entry required for ${chainId}`)
    } else {
      console.log(`[PREBUILD-PATCH-PROTOCOL-KIT]: No new entry required for chain ${chainId}`)
    }
  })

  if (added) {
    const formatValue = (v) =>
      typeof v === 'bigint' ? `${v}n` : typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v)

    const serializeItem = (item) => {
      const parts = Object.entries(item).map(([k, v]) => `${k}: ${formatValue(v)}`)
      return `  { ${parts.join(', ')} }`
    }

    const arrayBody = arr.map(serializeItem).join(',\n')

    const updatedText = jsConfigText.replace(
      /exports\.networks\s*=\s*\[((.|\n)*?)\];/,
      `exports.networks = [\n${arrayBody}\n];`,
    )

    fs.writeFileSync(SAFE_PROTOCOL_KIT_PATH, updatedText, 'utf-8')
    console.log('[PREBUILD-PATCH-PROTOCOL-KIT]: Finished protocol kit overwrite.')
  }
}

function getPath(templateId, item) {
  const configPath = path.resolve(process.cwd(), NETWORK_FOLDER, templateId, item)

  if (!fs.existsSync(configPath)) {
    return path.resolve(process.cwd(), NETWORK_FOLDER, FALLBACK_FOLDER, item)
  }

  return configPath
}

async function main() {
  if (!gatewayURL) throw new Error(`[PREBUILD-PATCH] No gateway URL found to fetch chain IDs`)

  const configPath = getPath(templateId, 'config.json')

  const networkConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

  const response = await fetch(`${gatewayURL}/v1/chains?cursor=limit%3D50`)

  // Fetch supported chainIDs from gateway
  if (!response.ok) throw new Error(`[PREBUILD-PATCH] Failed to fetch API: ${response.status} ${response.statusText}`)
  const apiData = await response.json()
  const chainData = apiData.results.map(({ chainId, shortName }) => ({
    chainId,
    shortName,
  }))

  await patchDeployments(networkConfig, chainData)
  await patchModules(networkConfig, chainData)
  await patchProtocolKit(chainData)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
