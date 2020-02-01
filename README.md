# Electron Distribution

[![license](https://img.shields.io/github/license/yi-ge/electron-distribution.svg?style=flat-square)](https://github.com/yi-ge/electron-distribution/blob/master/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/yi-ge/electron-distribution.svg?style=flat-square)](https://github.com/yi-ge/electron-distribution)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

[简体中文](README.zh-CN.md)

Electron build and auto update service, application distribution. Making application distribution easier.

A git repository corresponds to an electron app and an distributed system.

Electron Distribution server-side work in 64 bit Linux OS (required) and MacOS (optional), and build for x64 platform, other platform need to modify the code (It is easy).

![Electron Distribution](/preview.png)

## Quick Setup Guide

### In your Linux Server (x64)

#### Example

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
 wy373226722/electron-distribution:latest
```

China user: `docker pull registry.cn-shenzhen.aliyuncs.com/yi-ge/electron-distribution:latest` or `docker pull ccr.ccs.tencentyun.com/yi-ge/electron-distribution:latest`

You need to configure nginx and SSL by yourself. SCHEME only a tip.

#### Environment

| ENV Var | Default | Description |
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
| `LINUX_SERVER_USERNAME` | `"guest"` | `Only require build mac application. Your linux server ssh username.` |
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

Qiniu Object Storage: [https://developer.qiniu.com/kodo/sdk/1289/nodejs](https://developer.qiniu.com/kodo/sdk/1289/nodejs)  
Aliyun Object Storage: [https://github.com/ali-sdk/ali-oss](https://github.com/ali-sdk/ali-oss)  
Tencent Cloud Object Storage: [https://github.com/tencentyun/cos-nodejs-sdk-v5](https://github.com/tencentyun/cos-nodejs-sdk-v5) 

#### API Document

**Swagger:** https://yourdomain/documentation

API token require `SHA-512` encrypt.

**Github webhooks:** https://yourdomain/build/webhooks

Content type: `application/json`  
Secret: `your Token`

### In your Electron App

```bash
yarn add electron-builder electron-simple-updater -D
```

More about: [electron-builder](https://github.com/electron-userland/electron-builder) [electron-simple-updater](https://github.com/megahertz/electron-simple-updater)

Insert `build` configuration in your `package.json` ([https://www.electron.build](https://www.electron.build)):

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

## Mac APP Build And Code Signing

Install `Xcode 10.2` \ `brew (yarn 1.15.2)` \ `nvm (node 11.13.0)` in the macOS Majave (10.14.4), run the Xcode at least once.

Git and rsync are installed by default.

Start sshd:

```bash
sudo launchctl load -w /System/Library/LaunchDaemons/ssh.plist
```

Adding your server public key to mac `~/.ssh/authorized_keys`.
Adding your mac public key to server `~/.ssh/authorized_keys`.

Run the `ssh macName@macIp` in the linux server at least once .
Run the `ssh linux@linuxIp` in the mac server at least once.

Install `rsync` and enable sshd in your Linux Server.

## Author

Yi Wang a@wyr.me
