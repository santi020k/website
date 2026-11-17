const navigationKeys = {
  chromium: { next: 'Tab', previous: 'Shift+Tab' },
  firefox: { next: 'Tab', previous: 'Shift+Tab' },
  // WebKit on macOS includes links when Option accompanies Tab.
  webkit: { next: 'Alt+Tab', previous: 'Alt+Shift+Tab' }
} as const

export const keyboardNavigationKeys = (browserName: keyof typeof navigationKeys) => navigationKeys[browserName]
