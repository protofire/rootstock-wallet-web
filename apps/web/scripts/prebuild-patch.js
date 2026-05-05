import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const templateId = process.env.TEMPLATE_ID || 'default'
const isProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION || false

const gatewayURL =
  isProduction === 'true' ? process.env.NEXT_PUBLIC_GATEWAY_URL_PRODUCTION : process.env.NEXT_PUBLIC_GATEWAY_URL_STAGING

const FALLBACK_FOLDER = 'default'

const SAFE_DEPLOYMENTS_FILES = {
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

const ALLOWANCE_MODULE_FILES = {
  '0.1.0': ['allowance-module.json'],
  '0.1.1': ['allowance-module.json'],
}

const DEFAULT_ALLOWANCE_MODULES = {
  '0.1.0': '0xE46FE78DBfCa5E835667Ba9dCd3F3315E7623F8a',
  '0.1.1': '0xAA46724893dedD72658219405185Fb0Fc91e091C',
}

function getDefaultSafeDeployments(isEIP155 = false) {
  return {
    "1.3.0": isEIP155 ? "eip155" : ["canonical", "eip155"],
    "1.4.1": "canonical"
  }
}

function getPackagePath(packageName, item) {
  const packagePath = path.resolve('../../node_modules', ...packageName.split('/'), item)
  if (!fs.existsSync(packagePath)) {
    return path.resolve('../../node_modules/safe-network-config/networks', FALLBACK_FOLDER, item)
  }
  return packagePath
}

function getPackageVersion(packageName) {
  const packageJsonPath = getPackagePath(packageName, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found for package ${packageName}`)
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  return packageJson.version
}

function runCommand(cmd) {
  try {
    console.log(`[PREBUILD-PATCH] Executing: ${cmd}`)
    const output = execSync(cmd, { stdio: 'pipe' })
    return output && output.toString()
  } catch (error) {
    console.error(`[PREBUILD-PATCH] Error executing command: ${cmd}`, error)
    process.exit(1)
  }
}

function updateJsonFile(filePath, overwrites, fileName) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}, skipping`)
    return
  }

  const originalText = fs.readFileSync(filePath, 'utf-8')
  const indentMatch = originalText.match(/^{\r?\n(\s+)/)
  const indent = indentMatch ? indentMatch[1].length : 2
  const eol = originalText.includes('\r\n') ? '\r\n' : '\n'

  const config = JSON.parse(originalText)
  config.networkAddresses = config.networkAddresses || {}

  Object.entries(overwrites).forEach(([chainId, address]) => {
    if (!(chainId in config.networkAddresses)) {
      config.networkAddresses[chainId] = address
      console.log(`[PREBUILD-PATCH] Added ${chainId} to ${fileName}`)
    } else {
      console.log(`[PREBUILD-PATCH] ${chainId} chain already exists, skipping writing to ${fileName}`)
    }
  })

  let json = JSON.stringify(config, null, indent)

  json = json.replace(/\[\s+([^\[\]\{\}]*?)\s+\]/gs, (match, inner) => `[${inner.replace(/\s+/g, ' ').trim()}]`)

  fs.writeFileSync(filePath, json + eol, 'utf-8')
}

function applyMultiVersionPatches(packageName, chainData, configValues, editableFiles, moduleName = '') {
  const packageVersion = getPackageVersion(packageName)
  console.log(`[PREBUILD-PATCH] Detected ${packageName} version: ${packageVersion}`)

  const output = runCommand(`yarn patch ${packageName}@npm:${packageVersion}`)
  const match = output.match(/You can now edit the following folder: (.*)/)
  if (!match || match.length < 2) {
    throw new Error('[PREBUILD-PATCH] Cannot find patch folder path in yarn patch output')
  }
  const patchFolder = match[1].trim()

  Object.entries(configValues).forEach(([version, address]) => {
    const filesArray = editableFiles[version]

    filesArray.forEach((file) => {
      const jsonFile = path.join(patchFolder, `dist/assets/${moduleName + '/' ?? ''}v${version}/${file}`)
      const overwrites = {}
      chainData.forEach(({ chainId }) => {
        overwrites[chainId] = address
      })
      updateJsonFile(jsonFile, overwrites, file)
    })

    runCommand(`yarn patch-commit -s ${patchFolder}`)
    console.log('[PREBUILD-PATCH] All patches created and committed successfully.')
  })
}

async function main() {
  if (!gatewayURL) {
    console.log('[PREBUILD-PATCH] Gateway not found - skipping the patch process')
    return
  }
  const configPath = getPackagePath(`safe-network-config/networks/${templateId}`, 'config.json')
  const networkConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

  const response = await fetch(`${gatewayURL}/v1/chains?cursor=limit%3D50`)
  if (!response.ok) {
    throw new Error(`[PREBUILD-PATCH] Failed to fetch API: ${response.status} ${response.statusText}`)
  }
  const apiData = await response.json()
  const chainData = apiData.results.map(({ chainId, shortName }) => ({
    chainId,
    shortName,
  }))

  //1. Applying safe-deployments
 // TODO: add override per chain
  const safeDeploymentOverride = networkConfig.SAFE_DEPLOYMENTS_CONFIG ?? getDefaultSafeDeployments(networkConfig.EIP155, networkConfig.SUPPORTED_VERSIONS)
  if (safeDeploymentOverride) {
    applyMultiVersionPatches('@safe-global/safe-deployments', chainData, safeDeploymentOverride, SAFE_DEPLOYMENTS_FILES)
  }

  //2. Applying safe-modules-deployments
  const allowanceModuleOverride = networkConfig.ALLOWANCE_MODULE_OVERRIDE ?? DEFAULT_ALLOWANCE_MODULES
  applyMultiVersionPatches(
    '@safe-global/safe-modules-deployments',
    chainData,
    allowanceModuleOverride,
    ALLOWANCE_MODULE_FILES,
    'allowance-module',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
