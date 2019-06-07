import { uploadToCOS } from './tencent-cos'
import { uploadStream as uploadLocalFileToOSS } from './ali-oss'
import { uploadLocalFileToQiniu } from './qiniu'
import { OSS as OSSConfig, SYSTEM } from '../config'

export default async (key, localFilePath) => {
  switch (SYSTEM.OBJECT_STORAGE_TYPE) {
    case 'cos':
      const cos = await uploadToCOS(key, localFilePath)
      return cos.realPath
    case 'oss':
      const oss = await uploadLocalFileToOSS(key, localFilePath)
      // console.log(oss.url)
      if (oss) {
        return OSSConfig.url + key
      } else {
        return null
      }
    case 'qiniu':
      const qiniu = await uploadLocalFileToQiniu(key, localFilePath)
      return qiniu
  }
}
