import { archiveConfig } from '@santi020k/website-history/config'

import { rehypeLumenCode } from './src/plugins/rehype-lumen-code'
import { remarkAdmonitions } from './src/plugins/remark-admonitions'
import { remarkReadingTime } from './src/plugins/remark-reading-time'

export default archiveConfig('v3', [remarkReadingTime, remarkAdmonitions], [rehypeLumenCode])
