import fs from 'fs'
import { OSS as OSSConfig } from '../config'
import OSS from 'ali-oss'

// 阿里云OSS接口，返回Promise，使用.then()获取结果，.catch()抓取错误。

// web访问地址：OSSConfig.url + object_key
const client = OSSConfig.config.accessKeyId !== 'id' ? new OSS(OSSConfig.config) : { list () {} }

/***
 * 查看所有文件
 * 通过list来列出当前Bucket下的所有文件。主要的参数如下：

 prefix 指定只列出符合特定前缀的文件
 marker 指定只列出文件名大于marker之后的文件
 delimiter 用于获取文件的公共前缀
 max-keys 用于指定最多返回的文件个数
 * @type {*}
 */
// 不带任何参数，默认最多返回1000个文件
export const listFiles = client.list()

/***
 * 上传本地文件
 * @param object_key 文件名
 * @param local_file 本地文件路径
 *
 * join
 *该方法将多个参数值字符串结合成一个路径字符串，使用方式如下：
 *path.([path1], [path2], [...])
 *在该方法中，可以使用一个或多个字符串值参数，该参数返回将这些字符串值参数结合而成的路径。
 *var joinPath = path.join(__dirname, 'a', 'b', 'c');
 *console.log(joinPath);      //   D:\nodePro\fileTest\a\b\c
 *__dirname变量值代表程序运行的根目录。
 *
 * 用法示例：
 import path from 'path';
 return upload_local_file("test.js", path.join(__dirname, "address.js")).then(function (result) {
        console.log(result);
    }).catch(function (err) {
        console.log(err);
    });
 return list_files.then(function (result) {
        console.log(result.objects);
    }).catch(function (err) {
        console.error(err);
    });
 */
export const uploadLocalFile = (objectKey, localFile) => {
  return client.put(objectKey, localFile)
}

/***
 * 流式上传
 * 通过putStream接口来上传一个Stream中的内容，stream参数可以是任何实现了Readable Stream的对象，包含文件流，网络流等。当使用putStream接口时，SDK默认会发起一个chunked encoding的HTTP PUT请求。如果在options指定了contentLength参数，则不会使用chunked encoding。
 * @param objectKey
 * @param localFile
 * @param chunked 是否使用chunked encoding 默认不使用
 * @returns {Object}
 */
export const uploadStream = (objectKey, localFile, chunked = false) => {
  // // use 'chunked encoding'
  const stream = fs.createReadStream(localFile)
  if (chunked) {
    return client.putStream(objectKey, stream)
  } else {
    const size = fs.statSync(localFile).size // don't use 'chunked encoding'
    return client.putStream(objectKey, stream, {
      contentLength: size
    })
  }
}

/***
 * 上传Buffer内容
 * @param objectKey
 * @param buffer Buffer对象，例如new Buffer('hello world')
 */
export const uploadBuffer = (objectKey, buffer) => {
  return client.put(objectKey, buffer)
}

/***
 * 分片上传
 * 在需要上传的文件较大时，可以通过multipartUpload接口进行分片上传。分片上传的好处是将一个大请求分成多个小请求来执行，这样当其中一些请求失败后，不需要重新上传整个文件，而只需要上传失败的分片就可以了。一般对于大于100MB的文件，建议采用分片上传的方法。
 * @param objectKey
 * @param localFile
 */
export const uploadMultipart = (objectKey, localFile) => {
  return client.multipartUpload(objectKey, localFile, {
    progress: function * (p) {
      console.log('Progress: ' + p)
    }
  })
  // 上面的progress参数是一个进度回调函数，用于获取上传进度。progress可以是一个generator function(function*)，也可以是一个”thunk”：
  // const progress = function (p) {
  //     return function (done) {
  //         console.log(p);
  //         done();
  //     };
  // };
}

/***
 * 断点上传（需要循环调用）
 * 分片上传提供progress参数允许用户传递一个进度回调，在回调中SDK将当前已经上传成功的比例和断点信息作为参数。为了实现断点上传，可以在上传过程中保存断点信息（checkpoint），发生错误后，再将已保存的checkpoint作为参数传递给multipartUpload，此时将从上次失败的地方继续上传。
 * @param objectKey
 * @param localFile
 */
export const uploadMultiparts = (objectKey, localFile) => {
  let checkpoint
  return client.multipartUpload(objectKey, localFile, {
    checkpoint: checkpoint,
    progress: function * (percentage, cpt) {
      checkpoint = cpt
    }
  })
  // 上面的代码只是将checkpoint保存在变量中，如果程序崩溃的话就丢失了，用户也可以将它保存在文件中，然后在程序重启后将checkpoint信息从文件中读取出来。
}

/***
 * 下载文件到本地
 * @param objectKey
 * @param localFile 本地路径
 */
export const downloadLocalFile = (objectKey, localFile) => {
  return client.get(objectKey, localFile)
}

// export const download_stream = (object_key, local_file) => {
//     var result = yield client.getStream(object_key)
//     console.log(result)
//     var writeStream = fs.createWriteStream(local_file)
//     result.stream.pipe(writeStream)
// }
