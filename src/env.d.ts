declare module '@pagefind/default-ui' {
  export default class PagefindUI {
    constructor(arg: {
      baseUrl?: string
      bundlePath?: string
      element: string
      showImages?: boolean
      showSubResults?: boolean
    })

    init(): void
  }
}
