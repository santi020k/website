import { Buffer } from 'node:buffer'

import { describe, expect, test } from 'vitest'

import { encodePngIco } from '../favicon-ico.mjs'

describe('encodePngIco', () => {
  test('wraps PNG bytes in a single-image ICO directory', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    const ico = encodePngIco(png, 32)

    expect(ico.readUInt16LE(0)).toBe(0)
    expect(ico.readUInt16LE(2)).toBe(1)
    expect(ico.readUInt16LE(4)).toBe(1)
    expect(ico.readUInt8(6)).toBe(32)
    expect(ico.readUInt8(7)).toBe(32)
    expect(ico.readUInt16LE(10)).toBe(1)
    expect(ico.readUInt16LE(12)).toBe(32)
    expect(ico.readUInt32LE(14)).toBe(png.length)
    expect(ico.readUInt32LE(18)).toBe(22)
    expect(ico.subarray(22)).toEqual(png)
  })

  test('encodes a 256-pixel directory size as zero', () => {
    const ico = encodePngIco(Buffer.from([0x89]), 256)

    expect(ico.readUInt8(6)).toBe(0)
    expect(ico.readUInt8(7)).toBe(0)
  })

  test('rejects unsupported icon sizes', () => {
    expect(() => encodePngIco(Buffer.from([0x89]), 0)).toThrow(RangeError)
    expect(() => encodePngIco(Buffer.from([0x89]), 257)).toThrow(RangeError)
  })
})
