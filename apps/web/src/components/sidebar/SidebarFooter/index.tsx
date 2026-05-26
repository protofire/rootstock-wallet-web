import { type ReactElement } from 'react'
import HelpCenterIcon from '@/public/images/sidebar/help-center.svg'
import { Divider, ListItem, Stack, SvgIcon, Box, useTheme, Link } from '@mui/material'
import DebugToggle from '../DebugToggle'
import { IS_PRODUCTION } from '@/config/constants'
import { NEW_SUGGESTION_FORM, PROTOFIRE_SUPPORT_LINK } from '@/config/constants.extra'
import { SidebarListItemButton, SidebarListItemIcon, SidebarListItemText } from '../SidebarList'
import ProtofireLogo from '@/public/images/protofire.svg'
import SuggestionIcon from '@/public/images/common/lightbulb.svg'
import darkPalette from '@/components/theme/darkPalette'
import IndexingStatus from '@/components/sidebar/IndexingStatus'
import LicensedLogo from '@/public/images/logo-licensed.svg'
import TEMPLATE_CONFIG from '@/config/templateConfig'

const SidebarFooter = (): ReactElement => {
  const theme = useTheme()

  return (
    <>
      {!IS_PRODUCTION && (
        <>
          <ListItem disablePadding>
            <DebugToggle />
          </ListItem>

          <Divider flexItem sx={{ borderColor: 'background.main' }} />
        </>
      )}
      <ListItem style={{ padding: 'var(--space-1)' }}>
        <a target="_blank" rel="noopener noreferrer" href={PROTOFIRE_SUPPORT_LINK} style={{ width: '100%' }}>
          <SidebarListItemButton>
            <SidebarListItemIcon color="primary">
              <HelpCenterIcon />
            </SidebarListItemIcon>
            <SidebarListItemText data-testid="list-item-need-help" bold>
              Need help?
            </SidebarListItemText>
          </SidebarListItemButton>
        </a>
      </ListItem>

      <ListItem style={{ padding: '0 var(--space-1) 0' }}>
        <a target="_blank" rel="noopener noreferrer" href={NEW_SUGGESTION_FORM} style={{ width: '100%' }}>
          <SidebarListItemButton
            style={{
              color: 'black',
              backgroundColor:
                theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.secondary.main,
            }}
          >
            <SidebarListItemIcon>
              <Box
                sx={{
                  '& svg': {
                    '& path': () => ({
                      fill: 'black !important',
                    }),
                  },
                }}
              >
                <SuggestionIcon />
              </Box>
            </SidebarListItemIcon>
            <SidebarListItemText bold>New Features Suggestion?</SidebarListItemText>
          </SidebarListItemButton>
        </a>
      </ListItem>
      {TEMPLATE_CONFIG.IS_LICENSED && (
        <ListItem>
          <SvgIcon component={LicensedLogo} inheritViewBox sx={{ height: '2em', mb: '-5px', width: '100%' }} />
        </ListItem>
      )}

      <ListItem>
        <SidebarListItemText
          slotProps={{
            primary: {
              variant: 'caption',
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            Supported by <SvgIcon component={ProtofireLogo} inheritViewBox fontSize="small" sx={{ mx: 0.5 }} />
            <Link
              target="_blank"
              href="https://protofire.io/services/solution/safe-deployment"
              sx={{ color: darkPalette.primary.main, textDecoration: 'none' }}
            >
              Protofire
            </Link>
          </Box>
        </SidebarListItemText>
      </ListItem>
      <Stack direction="row" alignItems="center" spacing={1} my={0.5} mx={1}>
        <IndexingStatus />
      </Stack>
    </>
  )
}

export default SidebarFooter
