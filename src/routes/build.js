import Joi from 'joi'
import fs from 'fs'
import path from 'path'
import { SYSTEM } from '../config'
import { Client } from 'ssh2'
import { spawn } from 'child_process'
import auth from '../lib/auth'
import JsSHA from 'jssha'

const WIN_IMAGE_NAME = 'electronuserland/builder:wine-mono'
const LINUX_IMAGE_NAME = 'electronuserland/builder:10'

const mkdirsSync = (dirname) => {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

const getHashToken = () => {
  const shaObj = new JsSHA('SHA-512', 'TEXT')
  shaObj.update(SYSTEM.TOKEN)
  return shaObj.getHash('HEX')
}

export default [
  {
    method: 'GET',
    path: '/build/{type}',
    options: {
      auth: false,
      tags: ['api', 'build'],
      description: 'App Build',
      validate: {
        params: Joi.object({
          type: Joi.string().required().description('Type')
        }),
        query: Joi.object({
          token: Joi.string().required().description('Encrypted-Token')
        }).unknown()
      }
    },
    async handler (request) {
      if (!auth(request.query.token)) {
        return this.fail(null, 403, 'Token Error.')
      }
      const shaObj = new JsSHA('SHA-512', 'TEXT')
      shaObj.update(SYSTEM.TOKEN)
      const hashToken = shaObj.getHash('HEX')

      const publishOpt = SYSTEM.GH_TOKEN ? 'always' : 'never'

      let containerCmd = 'yarn --ignore-engines'
      let imageName = null
      let workPath = SYSTEM.WORKPATH
      const type = request.params.type
      const sourcePath = path.join(workPath, '/source')
      switch (type) {
        case 'win':
          workPath += '/win'
          imageName = WIN_IMAGE_NAME
          containerCmd += ' && yarn run build --' + type + ' --publish ' + publishOpt + ' && curl -X GET "' + SYSTEM.SCHEME + '://' + SYSTEM.DOMAIN + '/app/upload?platform=' + type + '&extended=x86-64&token=' + hashToken + '&logPath=$LOG_PATH" -H "cache-control: no-cache"'
          break
        case 'linux':
          workPath += '/linux'
          imageName = LINUX_IMAGE_NAME
          containerCmd += ' && yarn run build --' + type + ' --publish ' + publishOpt + ' && curl -X GET "' + SYSTEM.SCHEME + '://' + SYSTEM.DOMAIN + '/app/upload?platform=' + type + '&extended=x86-64&token=' + hashToken + '&logPath=$LOG_PATH" -H "cache-control: no-cache"'
          break
      }

      if (!fs.existsSync(SYSTEM.WORKPATH + '/logs/' + type)) mkdirsSync(SYSTEM.WORKPATH + '/logs/' + type)
      const LogPath = SYSTEM.WORKPATH + '/logs/' + type + '/' + (new Date()).getTime() + '.log'

      if (type === 'mac') {
        // 1. rsync server -> mac
        const writerStream = fs.createWriteStream(LogPath, { flags: 'a' })
        const rsync = spawn('/usr/bin/rsync', ['-avrz', '-e', `'/usr/bin/ssh -p ${SYSTEM.MAC_SERVER_PORT}'`, '--delete-after', '--exclude', '"node_modules"', sourcePath + '/', SYSTEM.MAC_SERVER_USERNAME + '@' + SYSTEM.MAC_SERVER_HOST + ':/tmp/' + SYSTEM.NAME])

        rsync.stdout.pipe(writerStream)
        rsync.stderr.pipe(writerStream)

        rsync.on('close', (code) => {
          const writerStream = fs.createWriteStream(LogPath, { flags: 'a' })
          writerStream.write(`\nChild process exited with code ${code} \n`)

          // 2. build app and rsync mac build dir -> server build dir
          let bashContent = ''
          if (SYSTEM.CSC_LINK) bashContent += 'export CSC_LINK=' + SYSTEM.CSC_LINK + '\n'
          if (SYSTEM.CSC_KEY_PASSWORD) bashContent += 'export CSC_KEY_PASSWORD=' + SYSTEM.CSC_KEY_PASSWORD + '\n'
          if (SYSTEM.GH_TOKEN) bashContent += 'export GH_TOKEN=' + SYSTEM.GH_TOKEN + '\n'
          bashContent += 'export LOG_PATH=' + LogPath + '\n'
          bashContent += 'cd /tmp/' + SYSTEM.NAME + '\n'
          bashContent += 'yarn --ignore-engines' + ' && yarn run build --' + type + ' --publish ' + publishOpt + '\n'
          // bashContent += `echo -e "Host ${SYSTEM.LINUX_SERVER_HOST}\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config\n`
          bashContent += `rsync -avrz -e 'ssh -p ${SYSTEM.LINUX_SERVER_PORT}' --exclude "node_modules" /tmp/` + SYSTEM.NAME + '/build/ ' + SYSTEM.LINUX_SERVER_USERNAME + '@' + SYSTEM.LINUX_SERVER_HOST + ':' + sourcePath + '/build \n'
          bashContent += 'curl -X GET "' + SYSTEM.SCHEME + '://' + SYSTEM.DOMAIN + '/app/upload?platform=' + type + '&extended=x86-64&token=' + getHashToken() + '&logPath=' + LogPath + '" -H "cache-control: no-cache"\n'
          writerStream.write('Run command: \n')
          writerStream.write(bashContent)

          const conn = new Client()
          conn.on('ready', function () {
            const writerStream = fs.createWriteStream(LogPath, { flags: 'a' })
            writerStream.write('Client :: ready\n')
            conn.shell(function (err, stream) {
              if (err) throw err
              stream.pipe(writerStream)
              stream.on('close', function () {
                const writerStream = fs.createWriteStream(LogPath, { flags: 'a' })
                writerStream.write('Stream :: close')
                conn.end()
              })
              stream.end(bashContent)
            })
          }).connect({
            host: SYSTEM.MAC_SERVER_HOST,
            port: Number(SYSTEM.MAC_SERVER_PORT),
            username: SYSTEM.MAC_SERVER_USERNAME,
            privateKey: require('fs').readFileSync('/root/.ssh/id_rsa')
          })
        })
      } else {
        const Env = [
          'LOG_PATH=' + LogPath
        ]

        if (SYSTEM.CSC_LINK) Env.push('CSC_LINK=' + SYSTEM.CSC_LINK)
        if (SYSTEM.CSC_KEY_PASSWORD) Env.push('CSC_KEY_PASSWORD=' + SYSTEM.CSC_KEY_PASSWORD)
        if (SYSTEM.GH_TOKEN) Env.push('GH_TOKEN=' + SYSTEM.GH_TOKEN)

        const optsc = {
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true,
          OpenStdin: true,
          StdinOnce: false,
          Env: Env,
          Cmd: ['/bin/bash', '-c', containerCmd],
          Image: imageName,
          WorkingDir: '/project',
          Volumes: {},
          VolumesFrom: [],
          HostConfig: {
            Binds: [
              workPath + ':/project:rw',
              '/etc/localtime:/etc/localtime:ro',
              workPath + '/.cache/electron:/root/.cache/electron',
              workPath + '/.cache/electron-builder:/root/.cache/electron-builder'
            ],
            CpusetCpus: SYSTEM.BUILD_CPU_LIMIT || '0',
            Memory: Number(SYSTEM.BUILD_MEMORY_LIMIT) || 0,
            AutoRemove: true
          }
        }

        const runDocker = () => {
          return new Promise((resolve, reject) => {
            this.docker.createContainer(optsc, (err, container) => {
              if (err || !container) return reject(err || 'container is null')

              container.attach({ stream: true, stdout: true, stderr: true }, (err, stream) => {
                if (err) return reject(err)
                const writerStream = fs.createWriteStream(LogPath)
                stream.pipe(writerStream)
              })

              container.start((err, data) => {
                if (err) return reject(err)
                console.log(data)
                resolve(container.id)
              })
            })
          })
        }

        try {
          const res = await runDocker()
          return this.success(res)
        } catch (err) {
          console.log(err)
          return this.fail(null, 10001, err.toString())
        }
      }
    }
  }
]
