/**
 * Simple logger utility that respects DEBUG environment variable.
 * Usage: DEBUG=1 node script.mjs
 */

const isDebug = process.env.DEBUG === '1' || process.env.DEBUG === 'true'

export const logger = {
  log: (...args) => {
    if (isDebug) {
      console.log(...args)
    }
  },
  warn: (...args) => {
    if (isDebug) {
      console.warn(...args)
    }
  },
  error: (...args) => {
    // Errors always print
    console.error(...args)
  },
  info: (...args) => {
    // Info always prints for user-facing messages
    console.info(...args)
  }
}

export default logger
