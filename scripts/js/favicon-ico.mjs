const ICO_DIRECTORY_SIZE = 22

/**
 * @param {Buffer} png
 * @param {number} size
 * @returns {Buffer}
 */
export const encodePngIco = (png, size) => {
  if (!Buffer.isBuffer(png)) throw new TypeError('ICO source must be a PNG buffer')

  if (!Number.isInteger(size) || size < 1 || size > 256) {
    throw new RangeError('ICO size must be an integer between 1 and 256')
  }

  const directory = Buffer.alloc(ICO_DIRECTORY_SIZE)
  const encodedSize = size === 256 ? 0 : size

  directory.writeUInt16LE(0, 0)

  directory.writeUInt16LE(1, 2)

  directory.writeUInt16LE(1, 4)

  directory.writeUInt8(encodedSize, 6)

  directory.writeUInt8(encodedSize, 7)

  directory.writeUInt8(0, 8)

  directory.writeUInt8(0, 9)

  directory.writeUInt16LE(1, 10)

  directory.writeUInt16LE(32, 12)

  directory.writeUInt32LE(png.length, 14)

  directory.writeUInt32LE(ICO_DIRECTORY_SIZE, 18)

  return Buffer.concat([directory, png])
}
