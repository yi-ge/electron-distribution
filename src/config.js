const isDev = process.env.NODE_ENV ? process.env.NODE_ENV === 'development' : false

export const SYSTEM = {
  NAME: process.env.NAME || 'APP',
  TOKEN: process.env.TOKEN || '1jH27dJf9s852',
  SCHEME: [isDev ? 'http' : (process.env.SCHEME || 'https')],
  DOMAIN: process.env.DOMAIN || 'www.example.com',
  REPOPATH: process.env.REPOPATH || 'git@github.com:yi-ge/electron-distribution.git',
  WORKPATH: process.env.WORKPATH || '/data',
  BUILD_TYPE: process.env.BUILD_TYPE ? process.env.BUILD_TYPE.split(',') : ['win', 'linux'], // ['linux', 'win', 'mac']
  GH_TOKEN: process.env.GH_TOKEN || '', // If you set publish option
  CSC_LINK: process.env.CSC_LINK || '', // https://www.electron.build/code-signing
  CSC_KEY_PASSWORD: process.env.CSC_KEY_PASSWORD || '',
  CSC_NAME: process.env.CSC_NAME || '',
  CSC_IDENTITY_AUTO_DISCOVERY: 'false',
  DOCKER_SOCKET: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  MAC_SERVER_HOST: process.env.MAC_SERVER_HOST || '127.0.0.1',
  MAC_SERVER_PORT: process.env.MAC_SERVER_PORT || '22',
  MAC_SERVER_USERNAME: process.env.MAC_SERVER_USERNAME || 'guest',
  LINUX_SERVER_HOST: process.env.LINUX_SERVER_HOST || '127.0.0.1',
  LINUX_SERVER_PORT: process.env.LINUX_SERVER_PORT || '22',
  LINUX_SERVER_USERNAME: process.env.LINUX_SERVER_USERNAME || 'root',
  OBJECT_STORAGE_TYPE: process.env.OBJECT_STORAGE_TYPE || 'cos'
}

export const SERVER = {
  port: isDev ? '65533' : (process.env.PORT || '80'),
  host: isDev ? '0.0.0.0' : (process.env.HOST || '0.0.0.0'),
  routes: {
    cors: {
      origin: ['*'],
      additionalHeaders: ['Expect', 'X-GitHub-Delivery', 'X-GitHub-Event', 'X-Hub-Signature']
    },
    state: {
      parse: false, // parse and store in request.state
      failAction: 'ignore' // may also be 'ignore' or 'log'
    }
  }
}

// 腾讯云
export const qcloudAccessKey = {
  SecretId: process.env.COS_SECRE_ID || '',
  SecretKey: process.env.COS_SECRE_KEY || ''
}

export const COS = {
  bucket: process.env.COS_BUCKET || 'bucketname-12345678',
  region: process.env.COS_REGION || 'ap-chengdu',
  url: process.env.COS_URL || 'https://cdn.xxx.com'
}

// 阿里云OSS
const AliyunAccessKey = {
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || 'id',
  accessKeySecret: process.env.OSS_ACCESS_SECRET || 'key'
}

export const OSS = {
  config: {
    region: process.env.OSS_REGION || 'oss-cn-qingdao',
    accessKeyId: AliyunAccessKey.accessKeyId,
    accessKeySecret: AliyunAccessKey.accessKeySecret,
    bucket: process.env.OSS_BUCKET || 'bucket',
    internal: process.env.OSS_INTERNAL === 'true',
    secure: true,
    timeout: 1200000 // 20min
  },
  url: process.env.OSS_URL || 'https://cdn.xxx.com'
}

export const QINIU = {
  accessKey: process.env.QINIU_ACCESS_KEY || '',
  secretKey: process.env.QINIU_SECRET_KEY || '',
  bucket: process.env.QINIU_BUCKET_KEY || '',
  url: process.env.QINIU_URL || 'https://cdn.xxx.com',
  zone: process.env.QINIU_ZONE || 'Zone_z0'
}
