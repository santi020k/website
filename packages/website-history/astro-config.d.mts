import type { AstroUserConfig } from 'astro'
import type { PluggableList } from 'unified'

export function archiveConfig(id: string, remarkPlugins: PluggableList, rehypePlugins?: PluggableList): AstroUserConfig
