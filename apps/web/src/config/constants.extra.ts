export const NEW_SUGGESTION_FORM = 'https://safe-feature-request.protofire.io'
export const TERMS_LINK =
  process.env.NEXT_PUBLIC_TERMS_LINK ||
  'https://raw.githubusercontent.com/protofire/safe-legal/refs/heads/main/terms.md'
export const COOKIE_LINK =
  process.env.NEXT_PUBLIC_COOKIE_LINK ||
  'https://raw.githubusercontent.com/protofire/safe-legal/refs/heads/main/cookie.md'

export const PROTOFIRE_SUPPORT_LINK = 'https://safe-support.protofire.io'

export const IMPRINT_LINK =
  process.env.NEXT_PUBLIC_IMPRINT_LINK ||
  'https://raw.githubusercontent.com/protofire/safe-legal/refs/heads/main/imprint.md'

export const LIFI_WIDGET_URL = process.env.NEXT_PUBLIC_LIFI_WIDGET_URL || 'https://lifi-swap.safe.protofire.io/'

export const OZ_SAFE_UTILS_URL = 'https://safeutils.openzeppelin.com'
export const PROTOFIRE_SAFE_UTILS_URL = 'https://safeutils.protofire.io'

// Sunset banners per chain ID
const RSK_WARNING_BANNER = {
  title: 'Transaction Indexing Issues on Rootstock Mainnet',
  description:
    'We are currently experiencing transaction indexing issues on Rootstock Mainnet due to a known bug in the RSK node\'s tracing implementation. Some transactions or Safes may not appear correctly in the interface. Our team is actively working on a fix and will notify you as soon as it is available. We apologize for the inconvenience.',
}

export const BANNERS: Record<string, { title: string; description: string }> = {
  '30': RSK_WARNING_BANNER,
}

// TODO: move to types
export interface TemplateConfig {
  EIP155: boolean
  SUPPORTED_VERSIONS: string[]
  ALLOWANCE_MODULE_OVERRIDE?: {
    '0.1.0': string
    '0.1.1': string
  }
  SAFE_UTILS_SUPPORTED?: boolean
  EXTRA_FOOTER_LINKS?: {
    label: string
    link: string
  }[]
  LOGO_DIMENSIONS?: {
    WELCOME?: {
      W?: string
      H?: string
    }
    HEADER?: {
      W?: string
      H?: string
    }
  }
  WELCOME_PALETTE?: string
  IS_LICENSED?: boolean
}
