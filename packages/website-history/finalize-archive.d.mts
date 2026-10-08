export function archiveFiles(directory: string): Promise<string[]>
export function archiveUrl(value: string, id: string): string
export function archiveHtml(html: string, id: string): string
export function finalizeArchive(dir: URL, version: { id: string, date: string }): Promise<void>
export function archiveSearchIndex(json: string, id: string): string
