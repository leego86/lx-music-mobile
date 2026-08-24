declare module 'react-native-file-system' {
  export interface FileType {
    name: string
    path: string
    isDirectory: boolean
    isFile: boolean
    lastModified: number
    canRead: boolean
    data: string
    mimeType: string
    size: number
  }

  export type Encoding = 'base64' | 'utf8'
  export type HashAlgorithm = 'md5' | 'sha1' | 'sha224' | 'sha256' | 'sha384' | 'sha512'

  export interface OpenDocumentOptions {
    mimeTypes?: string[]
    extTypes?: string[]
    multi?: boolean
    toPath?: string
    encoding?: Encoding
  }

  export const Dirs: {
    CacheDir: string
    DatabaseDir?: string
    DocumentDir: string
    MainBundleDir: string
    SDCardDir: string
  }

  export const getExternalStoragePaths: (is_removable?: boolean) => Promise<string[]>

  export const AndroidScoped: {
    getPersistedUriPermissions: () => Promise<string[]>
    releasePersistableUriPermission: (path: string) => Promise<void>
    openDocumentTree: (isPersist: boolean) => Promise<FileType>
    openDocument: (options: OpenDocumentOptions) => Promise<FileType>
  }

  export const FileSystem: {
    cp: (source: string, target: string) => Promise<void>
    exists: (path: string) => Promise<boolean>
    ls: (path: string) => Promise<FileType[]>
    mkdir: (path: string) => Promise<FileType>
    mv: (source: string, target: string) => Promise<boolean>
    rename: (source: string, name: string) => Promise<boolean>
    readFile: (path: string, encoding?: Encoding) => Promise<string>
    stat: (path: string) => Promise<FileType>
    unlink: (path: string) => Promise<boolean>
    writeFile: (path: string, data: string, encoding?: Encoding) => Promise<void>
    appendFile: (path: string, data: string, encoding?: Encoding) => Promise<void>
    gzipFile: (source: string, target: string) => Promise<void>
    unGzipFile: (source: string, target: string) => Promise<void>
    gzipString: (data: string, encoding?: Encoding) => Promise<string>
    unGzipString: (data: string, encoding?: Encoding) => Promise<string>
    hash: (path: string, algorithm?: HashAlgorithm) => Promise<string>
  }
}
