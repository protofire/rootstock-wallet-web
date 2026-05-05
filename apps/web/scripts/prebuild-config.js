import fs from 'fs'
import path from 'path'
import prettier from 'prettier'
import { cpSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const templateId = process.env.TEMPLATE_ID || 'default'
const destPublic = path.resolve(process.cwd(), './public')
const NETWORK_FOLDER = '../../node_modules/safe-network-config/networks'
const FALLBACK_FOLDER = 'default'

const prettierConfig = await prettier.resolveConfig(process.cwd())

/**
 * Fetch public files from a node_modules dependency ( "/safe-networks-config/networks/<<folder name>>")
 * Apply to the target public folder
 * Folder name is specified in TEMPLATE_ID
 */
function copyDirRecursive(src, dest) {
  cpSync(src, dest, { recursive: true, force: true })
  console.log(`[PREBUILD-CONFIG] Finished applying public files for ${templateId}`)
}
/**
 * Load and autogenerate config from the template folder
 * Folder name is specified in TEMPLATE_ID .env
 */
async function applyConfig(templateId, configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`[PREBUILD-CONFIG] Network config not found: ${configPath}`)
  }

  const configJson = fs.readFileSync(configPath, 'utf-8').trim()

  const outputTs = `
  import type { TemplateConfig } from "./constants.extra"

  /**
   * THIS FILE IS AUTO-GENERATED. DO NOT EDIT.
   * Generated from /networks/${templateId}/config.json
   */
  const TEMPLATE_CONFIG = (${configJson}) as TemplateConfig;
  export default TEMPLATE_CONFIG;
  `

  // Format using prettier to avoid build errors
  const formatted = await prettier.format(outputTs, {
    ...prettierConfig,
    parser: 'typescript',
  })

  const outputPath = path.resolve(process.cwd(), './src/config/templateConfig.ts')
  fs.writeFileSync(outputPath, formatted, 'utf-8')

  console.log(`[PREBUILD-CONFIG] Finished applying config for ${templateId}`)
}

async function applyPalette(templateId, palettePath, mode) {
  if (!fs.existsSync(palettePath)) {
    console.log(`[PREBUILD-CONFIG] Network palette for ${mode} mode not found. Skipping application.`)
    return
  }

  const paletteJson = fs.readFileSync(palettePath, 'utf-8').trim()

  const outputTs = `
  import type { Palette } from '@mui/material'

  /**
   * THIS FILE IS AUTO-GENERATED. DO NOT EDIT.
   * Generated from /networks/${templateId}/${mode}Palette.json
   */
  const TEMPLATE_PALETTE = (${paletteJson}) as Partial<Palette>;
  export default TEMPLATE_PALETTE;
  `

  // Format using prettier to avoid build errors
  const formatted = await prettier.format(outputTs, {
    ...prettierConfig,
    parser: 'typescript',
  })

  const outputPath = path.resolve(process.cwd(), `./src/config/template${mode[0].toUpperCase() + mode.slice(1)}Palette.ts`)
  fs.writeFileSync(outputPath, formatted, 'utf-8')
  console.log(`[PREBUILD-CONFIG] Finished applying ${mode} mode pallete for ${templateId}`)
}

function getPath(templateId, item) {
  const configPath = path.resolve(process.cwd(), NETWORK_FOLDER, templateId, item)

  if (!fs.existsSync(configPath)) {
    return path.resolve(process.cwd(), NETWORK_FOLDER, FALLBACK_FOLDER, item)
  }

  return configPath
}
/**
 * Main
 */
function main() {
  // Prep for data fetch, resort to fallback folder if not found in safe-networks-config
  const configPath = getPath(templateId, 'config.json')
  const srcPublic = getPath(templateId, 'public')
  const darkPalettePath = getPath(templateId, 'darkPalette.json')
  const lightPalettePath = getPath(templateId, 'lightPalette.json')

  // 1) Copy public files from template
  copyDirRecursive(srcPublic, destPublic)
  // 2) Generate config file
  applyConfig(templateId, configPath)

  // 3) Apply palette if exists
  applyPalette(templateId, darkPalettePath, 'dark')
  applyPalette(templateId, lightPalettePath, 'light')
}

main()
