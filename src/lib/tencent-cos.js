import COSSDK from 'cos-nodejs-sdk-v5'
import { qcloudAccessKey, COS } from '../config'

const cos = new COSSDK(qcloudAccessKey)

export const uploadToCOS = (key, filePath) => {
  return new Promise((resolve, reject) => {
    // 分片上传
    cos.sliceUploadFile(
      {
        Bucket: COS.bucket,
        Region: COS.region,
        Key: key,
        FilePath: filePath
      },
      function (err, data) {
        if (err || !data) {
          reject(err)
        } else {
          data.realPath = COS.url + key
          resolve(data)
        }
      }
    )
  })
}
