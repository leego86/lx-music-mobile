import { temporaryDirectoryPath, readDir, unlink, extname } from '@/utils/fs'
import {
  readPic as _readPic,
  readMetadata as _readMetadata,
  readLyric as _readLyric,
  type MusicMetadataFull,
} from 'react-native-local-media-metadata'
import iconv from 'iconv-lite'
export {
  type MusicMetadata,
  type MusicMetadataFull,
  writeMetadata,
  writePic,
  writeLyric,
} from 'react-native-local-media-metadata'

const highByteRx = /[\u0080-\u00ff]/
const highBytePairRx = /[\u0080-\u00ff]{2,}/
const nonLatin1Rx = /[\u0100-\uffff]/
const cjkRx = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/

export const fixNonUtf8Str = (str: string): string => {
  if (!highByteRx.test(str) || nonLatin1Rx.test(str) || !highBytePairRx.test(str)) return str
  const decoded = iconv.decode(iconv.encode(str, 'latin1'), 'gb18030')
  if (decoded.includes('\ufffd') || !cjkRx.test(decoded)) return str
  return decoded
}

export const readMetadata = async(filePath: string): Promise<MusicMetadataFull | null> => {
  const metadata = await _readMetadata(filePath)
  if (!metadata) return null
  return {
    ...metadata,
    name: fixNonUtf8Str(metadata.name),
    singer: fixNonUtf8Str(metadata.singer),
    albumName: fixNonUtf8Str(metadata.albumName),
  }
}

export const readLyric = async(filePath: string, isReadLrcFile: boolean = true): Promise<string> => {
  return fixNonUtf8Str(await _readLyric(filePath, isReadLrcFile))
}

let cleared = false
const picCachePath = temporaryDirectoryPath + '/local-media-metadata'

export const scanAudioFiles = async(dirPath: string) => {
  const files = await readDir(dirPath)
  return files.filter(file => {
    if (file.mimeType?.startsWith('audio/')) return true
    if (extname(file?.name ?? '') === 'ogg') return true
    return false
  }).map(file => file)
}

const clearPicCache = async() => {
  await unlink(picCachePath)
  cleared = true
}

export const readPic = async(dirPath: string): Promise<string> => {
  if (!cleared) await clearPicCache()
  return _readPic(dirPath, picCachePath)
}

// export interface MusicMetadata {
//   type: 'mp3' | 'flac' | 'ogg' | 'wav'
//   bitrate: string
//   interval: number
//   size: number
//   ext: 'mp3' | 'flac' | 'ogg' | 'wav'
//   albumName: string
//   singer: string
//   name: string
// }
// export const readMetadata = async(filePath: string): Promise<MusicMetadata | null> => {
//   return LocalMediaModule.readMetadata(filePath)
// }

// export const readPic = async(filePath: string): Promise<string> => {
//   return LocalMediaModule.readPic(filePath)
// }

// export const readLyric = async(filePath: string): Promise<string> => {
//   return LocalMediaModule.readLyric(filePath)
// }


