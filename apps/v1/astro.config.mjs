import { archiveConfig } from '@santi020k/website-history/config'

import { remarkAdmonitions } from './src/plugins/remark-admonitions'
import { remarkReadingTime } from './src/plugins/remark-reading-time'

export default archiveConfig('v1', [remarkReadingTime, remarkAdmonitions])
