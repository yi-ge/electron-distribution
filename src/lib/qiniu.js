
import qiniu from 'qiniu'
import { QINIU } from '../config'

const mac = new qiniu.auth.digest.Mac(QINIU.accessKey, QINIU.secretKey)
const putPolicy = new qiniu.rs.PutPolicy({
  scope: QINIU.bucket
})

const config = new qiniu.conf.Config()
// 空间对应的机房
config.zone = qiniu.zone[QINIU.zone]
// 是否使用https域名
config.useHttpsDomain = true
// 上传是否使用cdn加速
// config.useCdnDomain = true;

export const uploadLocalFileToQiniu = (key, localFile) => {
  return new Promise((resolve, reject) => {
    const uploadToken = putPolicy.uploadToken(mac)
    const resumeUploader = new qiniu.resume_up.ResumeUploader(config)
    const putExtra = new qiniu.resume_up.PutExtra()
    // 如果指定了断点记录文件，那么下次会从指定的该文件尝试读取上次上传的进度，以实现断点续传
    // putExtra.resumeRecordFile = 'progress.log';
    // 文件分片上传
    const remoteKey = key.substr(1) // 删除开头的/
    resumeUploader.putFile(uploadToken, remoteKey, localFile, putExtra, function (respErr,
      respBody, respInfo) {
      if (respErr) {
        return reject(respErr)
      }
      if (respInfo.statusCode === 200) {
        resolve(QINIU.url + key)
      } else {
        console.log(respInfo.statusCode)
        console.log(respBody)
        return reject(respInfo)
      }
    })
  })
}
