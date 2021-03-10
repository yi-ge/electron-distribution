import fs from 'fs'
import Joi from 'joi'
import git from 'simple-git'
import path from 'path'
import uploadToObjectStorage from '../lib/upload'
import auth from '../lib/auth'
import {
  SYSTEM
} from '../config'

const GIT_SSH_COMMAND = 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'

export default [{
  method: 'GET',
  path: '/app/upload',
  options: {
    auth: false,
    tags: ['api', 'app'],
    description: 'Upload app to object storage.',
    validate: {
      query: Joi.object({
        platform: Joi.string().required().description('System platform'),
        extended: Joi.string().default('x86-64').description('System extended'),
        startDate: Joi.string().required().description('Build startDate'),
        logPath: Joi.string().required().description('Log file path.'),
        token: Joi.string().required().description('Encrypted-Token')
      }).unknown()
    }
  },
  async handler (request) {
    if (!auth(request.query.token)) {
      return this.fail(null, 403, 'Token Error.')
    }

    const platform = request.query.platform
    const extended = request.query.extended
    const logPath = request.query.logPath
    const startDate = request.query.startDate
    const workPath = SYSTEM.WORKPATH
    const sourcePath = path.join(workPath, '/source')

    const gitLog = (workPath) => {
      return new Promise((resolve, reject) => {
        git(workPath).env({
          ...process.env,
          GIT_SSH_COMMAND
        }).log({
          n: 1
        }, (err, status) => {
          if (err) {
            return reject(err)
          }
          resolve(status)
        })
      })
    }

    try {
      const log = await gitLog(sourcePath)
      if (log && log.all && log.all.length === 1) {
        const gitInfo = log.all[0]
        let packageJson = null
        let linuxPath = null
        let winPath = null
        let filePath = null
        let filePath2 = null
        let filename = null
        let filename2 = null
        let nupkg = null
        let RELEASES = null
        let RELEASESname = null
        let nupkgname = null

        switch (platform) {
          case 'mac':
            packageJson = JSON.parse(fs.readFileSync(path.join(sourcePath, 'package.json'), 'utf-8'))
            filePath = path.join(sourcePath, 'build', packageJson.build.productName + '-' + packageJson.version + '.dmg')
            filePath2 = path.join(sourcePath, 'build', packageJson.build.productName + '-' + packageJson.version + '-mac.zip')
            filename = packageJson.name + '-' + packageJson.version + '.dmg'
            filename2 = packageJson.name + '-' + packageJson.version + '-mac.zip'
            break
          case 'linux':
            linuxPath = path.join(workPath, '/linux')
            packageJson = JSON.parse(fs.readFileSync(path.join(linuxPath, 'package.json'), 'utf-8'))
            if (extended === 'armv7l') {
              filePath = path.join(linuxPath, 'build', packageJson.name + '-' + packageJson.version + '-armv7l.AppImage')
              filename = packageJson.name + '-' + packageJson.version + '-armv7l.AppImage'
            } else {
              filePath = path.join(linuxPath, 'build', packageJson.name + '-' + packageJson.version + '-x86_64.AppImage')
              filename = packageJson.name + '-' + packageJson.version + '-x86_64.AppImage'
            }
            break
          case 'win':
            winPath = path.join(workPath, '/win')
            packageJson = JSON.parse(fs.readFileSync(path.join(winPath, 'package.json'), 'utf-8'))
            filePath = path.join(winPath, 'build', 'squirrel-windows', packageJson.build.productName + ' Setup ' + packageJson.version + '.exe')
            filename = packageJson.name + '-' + packageJson.version + '.exe'
            nupkg = path.join(winPath, 'build', 'squirrel-windows', packageJson.name + '-' + packageJson.version + '-full.nupkg')
            RELEASES = path.join(winPath, 'build', 'squirrel-windows', 'RELEASES')
            RELEASESname = path.join('RELEASES-' + packageJson.version, 'RELEASES')
            nupkgname = packageJson.name + '-' + packageJson.version + '-full.nupkg'
            break
        }

        this.$db.get('buildLog').find({
          startDate
        }).assign({
          status: 'uploading'
        }).write()

        const fileFullPath = path.join('/app/', packageJson.name, packageJson.version, filename)

        try {
          var upload = () => {
            uploadToObjectStorage(fileFullPath, filePath).then(res => {
              this.$db.get('appLog').push({
                name: packageJson.name,
                downloadUrl: res,
                version: packageJson.version,
                platform,
                extended,
                action: 'release',
                type: 'install',
                logPath,
                author: gitInfo.author_name,
                authorEmail: gitInfo.author_email,
                message: gitInfo.message,
                releaseDate: new Date().getTime().toString()
              }).write()

              if (platform === 'linux') {
                this.$db.get('buildLog').find({
                  startDate
                }).assign({
                  status: 'finish'
                }).write()
              }
            }).catch(err => {
              console.log(err)
            })
          }
          upload()
        } catch (err) {
          console.log(err)
          upload()
        }

        if (filePath2) {
          const fileFullPath2 = path.join('/app/', packageJson.name, packageJson.version, filename2)

          try {
            var upload2 = () => {
              uploadToObjectStorage(fileFullPath2, filePath2).then(res => {
                this.$db.get('appLog').push({
                  name: packageJson.name,
                  downloadUrl: res,
                  version: packageJson.version,
                  platform,
                  extended,
                  action: 'release',
                  type: 'maczip',
                  logPath,
                  author: gitInfo.author_name,
                  authorEmail: gitInfo.author_email,
                  message: gitInfo.message,
                  releaseDate: new Date().getTime().toString()
                }).write()

                this.$db.get('buildLog').find({
                  startDate
                }).assign({
                  status: 'finish'
                }).write()
              }).catch(err => {
                console.log(err)
              })
            }
            upload2()
          } catch (err) {
            console.log(err)
            upload2()
          }
        }

        if (nupkg) {
          const fileFullPath3 = path.join('/app/', packageJson.name, packageJson.version, nupkgname)

          try {
            var upload3 = () => {
              uploadToObjectStorage(fileFullPath3, nupkg).then(res => {
                this.$db.get('appLog').push({
                  name: packageJson.name,
                  downloadUrl: res,
                  version: packageJson.version,
                  platform,
                  extended,
                  action: 'release',
                  type: 'nupkg',
                  logPath,
                  author: gitInfo.author_name,
                  authorEmail: gitInfo.author_email,
                  message: gitInfo.message,
                  releaseDate: new Date().getTime().toString()
                }).write()

                this.$db.get('buildLog').find({
                  startDate
                }).assign({
                  status: 'finish'
                }).write()
              }).catch(err => {
                console.log(err)
              })
            }
            upload3()
          } catch (err) {
            console.log(err)
            upload3()
          }

          const fileFullPath4 = path.join('/app/', packageJson.name, packageJson.version, RELEASESname)
          try {
            var upload4 = () => {
              uploadToObjectStorage(fileFullPath4, RELEASES).then(res => {
                this.$db.get('appLog').push({
                  name: packageJson.name,
                  downloadUrl: res,
                  version: packageJson.version,
                  platform,
                  extended,
                  action: 'release',
                  type: 'RELEASES',
                  logPath,
                  author: gitInfo.author_name,
                  authorEmail: gitInfo.author_email,
                  message: gitInfo.message,
                  releaseDate: new Date().getTime().toString()
                }).write()
              }).catch(err => {
                console.log(err)
              })
            }
            upload4()
          } catch (err) {
            console.log(err)
            upload4()
          }
        }

        return this.success('ok')
      } else {
        return this.fail(null, 10003, 'Get git log content error.')
      }
    } catch (err) {
      console.log(err)
      return this.fail(err.toString(), 10001, 'Get git log error.')
    }
  }
}]
