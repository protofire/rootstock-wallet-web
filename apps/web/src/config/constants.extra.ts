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
  title: 'Scheduled Maintenance — Transaction Service Migration',
  description:
    "Due to a known bug in the RSK node's tracing implementation (https://github.com/rsksmart/rskj/issues/3543) that prevents us from indexing the network properly, we are switching to an event-based indexing mechanism. As a result, queued transactions will be lost and will need to be recreated, and Safes created with older contract versions (1.1.1 and 1.2.0) may not be recognized by the interface. If you are unable to load your Safe, please reach out to our support team at https://safe-support.protofire.io. We apologize for the inconvenience and thank you for your patience.",
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
