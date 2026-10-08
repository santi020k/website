export const truncateTitle = (title: string): string => title.length > 50 ? `${title.slice(0, 50)}...` : title
