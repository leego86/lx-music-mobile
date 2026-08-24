declare module 'react-native-local-media-metadata' {
  export interface MusicMetadata {
    albumName: string
    singer: string
    name: string
  }

  export interface MusicMetadataFull {
    type: 'mp3' | 'flac' | 'ogg' | 'wav'
    bitrate: string
    interval: number
    size: number
    ext: 'mp3' | 'flac' | 'ogg' | 'wav'
    albumName: string
    singer: string
    name: string
  }

  export const readMetadata: (filePath: string) => Promise<MusicMetadataFull | null>
  export const writeMetadata: (filePath: string, metadata: MusicMetadata, isOverwrite?: boolean) => Promise<void>
  export const readPic: (filePath: string, picDir: string) => Promise<string>
  export const writePic: (filePath: string, picPath: string) => Promise<void>
  export const readLyric: (filePath: string, isReadLrcFile?: boolean) => Promise<string>
  export const writeLyric: (filePath: string, lyric: string) => Promise<void>
}
