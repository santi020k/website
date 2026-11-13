export const archiveOrigin: string
export function addArchiveNotice(html: string, notice: string): string
export function archiveFiles(directory: string): Promise<string[]>
export function archiveUrl(value: string, id: string): string
export function isArchiveExit(value: string, id: string): boolean
export function archiveHtml(html: string, id: string): string
export function archiveHeaderRules(id: string, policy?: string): string
export function readHeaderPolicy(headers: string): string | undefined
export function finalizeArchive(dir: URL, version: { id: string, date: string }): Promise<void>
export function archiveSearchIndex(json: string, id: string): string
