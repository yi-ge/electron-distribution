# Electron 应用分发系统

[![license](https://img.shields.io/github/license/yi-ge/electron-distribution.svg?style=flat-square)](https://github.com/yi-ge/electron-distribution/blob/master/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/yi-ge/electron-distribution.svg?style=flat-square)](https://github.com/yi-ge/electron-distribution)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

[简体中文](README.zh-CN.md)

`Electron 应用分发系统`提供应用程序编译、自动升级、分发服务。让`Electron`应用分发变得非常容易。

一个`git`仓库对应一个`Electron`应用程序，对应使用一套应用分发系统。

`Electron 应用分发系统`服务器端工作在64位Linux操作系统（必须）和MacOS（可选），默认编译x64应用程序, 其它平台及架构需要修改相应代码（不过这很容易实现）.

## 快速开始

### Linux Server (x64) 服务器部署指南

#### 命令运行例子

```bash
docker run -itd --name electron-distribution --restart always \
 -e NAME=your-app-name \
 -e SCHEME=https \
 -e DOMAIN=www.example.com \
 -e TOKEN=123456 \
 -e REPOPATH=git@github.com:abc/def.git \
 -e BUILD_TYPE=win,linux,mac \
 -e WORKPATH=/data \
 -e OBJECT_STORAGE_TYPE=cos
 -v /data:/data \
 -p 80:80 \
 -v /var/run/docker.sock:/var/run/docker.sock \
 -v /root/.ssh:/root/.ssh \
 -v /data/icon.ico:/project/public/icon.ico \
 wy373226722/electron-distribution
```

**国内用户**
阿里云镜像：`docker pull registry.cn-shenzhen.aliyuncs.com/yi-ge/electron-distribution:latest`  

腾讯云镜像：`docker pull ccr.ccs.tencentyun.com/yi-ge/electron-distribution:latest`  
**注意**
你需要自行安装Nginx并配置使其支持SSL，这是必须的，否则应用程序自动更新可能会失效。`SCHEME`只是一个标识。

#### 环境变量

| 变量名 | 默认值 | 描述 |
|---|---|---|
| `NAME` | `"APP"` | `Your app name. Numbers, letters and "-".` |
| `SCHEME` | `"https"` | `Production environment only work with SSL.` |
| `DOMAIN` | `"www.example.com"` | `Your Electron Distribution server-side domain.` |
| `TOKEN` | `"1jH27dJf9s852"` | `Your Electron Distribution API TOKEN.` |
| `REPOPATH` | `"git@github.com:yi-ge/electron-distribution.git"` | `Your electron app repository.` |
| `BUILD_TYPE` | `"win,linux"` | `win,linux,mac` |
| `WORKPATH` | `"/data"` | `-v /data:/data, The two path must be consistent.` |
| `DOCKER_SOCKET` | `"/var/run/docker.sock"` | `Docker socket path.` |
| `MAC_SERVER_HOST` | `"127.0.0.1"` | `Your macOS server host.` |
| `MAC_SERVER_PORT` | `"22"` | `Your macOS server ssh port.` |
| `MAC_SERVER_USERNAME` | `"guest"` | `Your macOS server ssh username.` |
| `LINUX_SERVER_HOST` | `"127.0.0.1"` | `Only require build mac application. Your linux server host.` |
| `LINUX_SERVER_PORT` | `"22"` | `Only require build mac application. Your linux server ssh port.` |
| `LINUX_SERVER_USERNAME` | `"root"` | `Only require build mac application. Your linux server ssh username.` |
| `GH_TOKEN` | `""` | `If you set publish option.` |
| `CSC_LINK` | `""` | `https://www.electron.build/code-signing` |
| `CSC_KEY_PASSWORD` | `""` | `https://www.electron.build/code-signing` |
| `CSC_NAME`, | `""` | `https://www.electron.build/code-signing` |
| `BUILD_CPU_LIMIT` | `"0"` | `Linux and Windows build cpu limit. CPUs in which to allow execution (e.g., 0-3, 0,1)` |
| `BUILD_MEMORY_LIMIT` | `0` | `Linux and Windows memory limit in bytes. 1024 * 1024 * 1024 bytes = 1073741824 bytes = 1GB` |
| `OBJECT_STORAGE_TYPE` | `"cos"` | `cos: Tencent Cloud Object Storage; oss: Aliyun Object Storage; qiniu: Qiniu Object Storage.` |
| `QINIU_ACCESS_KEY` | `""` | `Qiniu Object Storage, accessKey.` |
| `QINIU_SECRET_KEY` | `""` | `Qiniu Object Storage, secretKey.` |
| `QINIU_BUCKET_KEY` | `""` | `Qiniu Object Storage, bucket.` |
| `QINIU_ZONE` | `"Zone_z0"` | `华东 Zone_z0、华北 Zone_z1、华南 Zone_z2、北美 Zone_na0` |
| `QINIU_URL` | `"https://cdn.xxx.com"` | `Qiniu Object Storage CDN url.` |
| `OSS_ACCESS_KEY_ID` | `"id"` | `Aliyun accessKeyId.` |
| `OSS_ACCESS_SECRET` | `"secret"` | `Aliyun accessKeySecret.` |
| `OSS_REGION` | `"oss-cn-qingdao"` | `Aliyun Object Storage, Region.` |
| `OSS_BUCKET` | `"bucket"` | `Aliyun Object Storage, Bucket.` |
| `OSS_URL` | `"https://cdn.xxx.com"` | `Aliyun Object Storage CDN url.` |
| `OSS_INTERNAL` | `false` | `Access aliyun OSS with aliyun internal network or not, default is false. If your servers are running on aliyun too, you can set "true" to save lot of money.` |
| `COS_SECRE_ID` | `""` | `Tencent Cloud Object Storage SecretId.` |
| `COS_SECRE_KEY` | `""` | `SecretKey.` |
| `COS_BUCKET` | `"bucketname-12345678"` | `Bucket.` |
| `COS_REGION` | `"ap-chengdu"` | `Region.` |
| `COS_URL` | `"https://cdn.xxx.com"` | `Object Storage CDN url.` |

七牛对象存储: [https://developer.qiniu.com/kodo/sdk/1289/nodejs](https://developer.qiniu.com/kodo/sdk/1289/nodejs)  
阿里云对象存储: [https://github.com/ali-sdk/ali-oss](https://github.com/ali-sdk/ali-oss)  
腾讯云对象存储: [https://github.com/tencentyun/cos-nodejs-sdk-v5](https://github.com/tencentyun/cos-nodejs-sdk-v5)  

#### API 文档

**Swagger:** https://yourdomain/documentation

API中的token需要进行`SHA-512`加密。

**Github webhooks:** https://yourdomain/build/webhooks

Content type: `application/json`  
Secret: `your Token`

### Electron 应用程序配置指南

```bash
yarn add electron-builder electron-simple-updater -D
```

关于 [electron-builder](https://github.com/electron-userland/electron-builder) [electron-simple-updater](https://github.com/megahertz/electron-simple-updater)

在你的`package.json`文件中加入`build`配置信息([https://www.electron.build](https://www.electron.build)):

```json
"scripts": {
  "build": "node config/build.js && electron-builder",
  "build:dir": "node config/build.js && electron-builder --dir",
  ...
},
"build": {
  "productName": "Your App Name",
  "appId": "com.appid.abc",
  "directories": {
    "output": "build"
  },
  "files": [
    "dist/electron/**/*"
  ],
  "dmg": {
    "contents": [
      {
        "x": 410,
        "y": 150,
        "type": "link",
        "path": "/Applications"
      },
      {
        "x": 130,
        "y": 150,
        "type": "file"
      }
    ]
  },
  "mac": {
    "icon": "build/icons/icon.icns"
  },
  "win": {
    "icon": "build/icons/icon.ico",
    "target": "squirrel"
  },
  "linux": {
    "artifactName": "${productName}-${version}-${arch}.${ext}",
    "icon": "build/icons"
  },
  "squirrelWindows": {
    "iconUrl": "https://yourServer/app/icon.ico"
  }
},
```

## Mac APP 编译及代码签名

在macOS Majave (10.14.4)中安装 `Xcode 10.2` \ `brew (yarn 1.15.2)` \ `nvm (node 11.13.0)`, 至少运行一次`Xcode`。

操作系统默认安装了 Git 和 rsync。

开启 sshd:

```bash
sudo launchctl load -w /System/Library/LaunchDaemons/ssh.plist
```

添加你的服务器公钥到Mac `~/.ssh/authorized_keys`。
添加你的Mac公钥到服务器 `~/.ssh/authorized_keys`。

在你的Linux服务器中安装`rsync`，并开启SSH服务。
