import fs from 'fs'
import path from 'path'
import git from 'simple-git'
import { SYSTEM } from '../config'
import { Client } from 'ssh2'
import { spawn } from 'child_process'
import JsSHA from 'jssha'
import Joi from 'joi'
import db from '../lib/db'

const repoPath = SYSTEM.REPOPATH
const workPath = SYSTEM.WORKPATH
const sourcePath = path.join(workPath, '/source')
const linuxPath = path.join(workPath, '/linux')
const winPath = path.join(workPath, '/win')

const WIN_IMAGE_NAME = 'electronuserland/builder:wine-mono'
const LINUX_IMAGE_NAME = 'electronuserland/builder:10'
const GIT_SSH_COMMAND = 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'

const getHashToken = () => {
  const shaObj = new JsSHA('SHA-512', 'TEXT')
  shaObj.update(SYSTEM.TOKEN)
  return shaObj.getHash('HEX')
}

const gitCodeUpdate = async (buidType) => {
  const gitClone = (repoPath, workPath, type) => {
    return new Promise((resolve, reject) => {
      git().env({
        ...process.env,
        GIT_SSH_COMMAND
      })
        .clone(repoPath, workPath, (err) => {
          if (err) {
            reject(err)
            return
          }
          resolve({
            code: 1,
            type: 'clone',
            change: true
          })
        })
    })
  }

  const gitPull = (workPath, type) => {
    return new Promise((resolve, reject) => {
      git(workPath).env({
        ...process.env,
        GIT_SSH_COMMAND
      })
        .pull((err, update) => {
          if (err) {
            reject(err)
            return
          }
          if (update && update.summary.changes) {
            resolve({
              code: 1,
              type: 'pull',
              change: true
            })
          } else {
            resolve({
              code: 1,
              type: 'clone',
              change: false
            })
          }
        })
    })
  }

  const promiseList = []

  if (buidType.includes('mac')) {
    if (!fs.existsSync(sourcePath)) {
      mkdirsSync(sourcePath)
      promiseList.push(gitClone(repoPath, sourcePath, 'Source'))
    } else {
      if (fs.readdirSync(sourcePath).includes('.git')) {
        promiseList.push(gitPull(sourcePath, 'Source'))
      } else {
        promiseList.push(gitClone(repoPath, sourcePath, 'Source'))
      }
    }
  }

  if (buidType.includes('linux')) {
    if (!fs.existsSync(linuxPath)) {
      mkdirsSync(linuxPath)
      promiseList.push(gitClone(repoPath, linuxPath, 'Linux'))
    } else {
      if (fs.readdirSync(linuxPath).includes('.git')) {
        promiseList.push(gitPull(linuxPath, 'Linux'))
      } else {
        promiseList.push(gitClone(repoPath, linuxPath, 'Linux'))
      }
    }
  }

  if (buidType.includes('win')) {
    if (!fs.existsSync(winPath)) {
      mkdirsSync(winPath)
      promiseList.push(gitClone(repoPath, winPath, 'Win'))
    } else {
      if (fs.readdirSync(winPath).includes('.git')) {
        promiseList.push(gitPull(winPath, 'Win'))
      } else {
        promiseList.push(gitClone(repoPath, winPath, 'Win'))
      }
    }
  }

  const res = await Promise.all(promiseList)

  return res.every(a => a.code === 1)
}

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

const startDockerToBuild = async (name, version, type, docker) => {
  const publishOpt = SYSTEM.GH_TOKEN ? 'always' : 'never'
  const startDate = new Date().getTime().toString()

  let containerCmd = 'yarn --ignore-engines'
  let imageName = null
  let workPath = SYSTEM.WORKPATH
  switch (type) {
    case 'win':
      workPath += '/win'
      imageName = WIN_IMAGE_NAME
      containerCmd += ' && yarn run build --' + type + ' --publish ' + publishOpt + ' && curl -X GET "' + SYSTEM.SCHEME + '://' + SYSTEM.DOMAIN + '/app/upload?platform=' + type + '&extended=x86-64&token=' + getHashToken() + '&startDate=' + startDate + '&logPath=$LOG_PATH" -H "cache-control: no-cache"'
      break
    case 'linux':
      workPath += '/linux'
      imageName = LINUX_IMAGE_NAME
      containerCmd += ' && yarn run build --' + type + ' --publish ' + publishOpt + ' && curl -X GET "' + SYSTEM.SCHEME + '://' + SYSTEM.DOMAIN + '/app/upload?platform=' + type + '&extended=x86-64&token=' + getHashToken() + '&startDate=' + startDate + '&logPath=$LOG_PATH" -H "cache-control: no-cache"'
      break
  }

  if (!fs.existsSync(SYSTEM.WORKPATH + '/logs/' + type)) mkdirsSync(SYSTEM.WORKPATH + '/logs/' + type)
  const logPath = SYSTEM.WORKPATH + '/logs/' + type + '/' + (new Date()).getTime() + '.log'

  db.get('buildLog').push({
    name,
    version,
    platform: type,
    extended: 'x86-64',
    action: 'build',
    status: 'buiding',
    logPath,
    startDate
  }).write()

  const Env = [
    'LOG_PATH=' + logPath
  ]

  if (SYSTEM.CSC_LINK) Env.push('CSC_LINK=' + SYSTEM.CSC_LINK)
  if (SYSTEM.CSC_KEY_PASSWORD) Env.push('CSC_KEY_PASSWORD=' + SYSTEM.CSC_KEY_PASSWORD)
  if (SYSTEM.GH_TOKEN) Env.push('GH_TOKEN=' + SYSTEM.GH_TOKEN)

  const optsc = {
    'AttachStdin': true,
    'AttachStdout': true,
    'AttachStderr': true,
    'Tty': true,
    'OpenStdin': true,
    'StdinOnce': false,
    'Env': Env,
    'Cmd': ['/bin/bash', '-c', containerCmd],
    'Image': imageName,
    'WorkingDir': '/project',
    'Volumes': {},
    'VolumesFrom': [],
    'HostConfig': {
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

  const runDocker = (docker) => {
    return new Promise((resolve, reject) => {
      docker.createContainer(optsc, (err, container) => {
        if (err || !container) return reject(err || 'container is null')

        container.attach({stream: true, stdout: true, stderr: true}, (err, stream) => {
          const writerStream = fs.createWriteStream(logPath)
          if (err) return writerStream.write(err.toString())
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

  return runDocker(docker)
}

const macBuild = async (name, version) => {
  const type = 'mac'
  const publishOpt = SYSTEM.GH_TOKEN ? 'always' : 'never'

  if (!fs.existsSync(SYSTEM.WORKPATH + '/logs/' + type)) mkdirsSync(SYSTEM.WORKPATH + '/logs/' + type)
  const logPath = SYSTEM.WORKPATH + '/logs/' + type + '/' + (new Date()).getTime() + '.log'

  const startDate = new Date().getTime().toString()
  db.get('buildLog').push({
    name,
    version,
    platform: type,
    extended: 'x86-64',
    action: 'build',
    status: 'buiding',
    logPath: logPath,
    startDate
  }).write()

  // 1. rsync server -> mac
  const writerStream = fs.createWriteStream(logPath, {flags: 'a'})
  const cmd = `rsync -avrz -e 'ssh -p ${SYSTEM.MAC_SERVER_PORT}' --delete-after --exclude "node_modules" ${sourcePath}/ ${SYSTEM.MAC_SERVER_USERNAME}@${SYSTEM.MAC_SERVER_HOST}:/tmp/${SYSTEM.NAME}`
  writerStream.write(cmd)
  const rsync = spawn('/bin/sh', ['-c', cmd])
  rsync.stdout.pipe(writerStream)
  rsync.stderr.pipe(writerStream)

  rsync.on('close', (code) => {
    const writerStream = fs.createWriteStream(logPath, {flags: 'a'})
    writerStream.write(`\nChild process exited with code ${code} \n`)

    // 2. build app and rsync mac build dir -> server build dir
    let bashContent = ''
    if (SYSTEM.CSC_LINK) bashContent += 'export CSC_LINK=' + SYSTEM.CSC_LINK + '\n'
    if (SYSTEM.CSC_KEY_PASSWORD) bashContent += 'export CSC_KEY_PASSWORD=' + SYSTEM.CSC_KEY_PASSWORD + '\n'
    if (SYSTEM.GH_TOKEN) bashContent += 'export GH_TOKEN=' + SYSTEM.GH_TOKEN + '\n'
    bashContent += 'export LOG_PATH=' + logPath + '\n'
    bashContent += 'cd /tmp/' + SYSTEM.NAME + '\n'
    bashContent += `yarn --ignore-engines` + ' && yarn run build --' + type + ' --publish ' + publishOpt + '\n'
    // bashContent += `echo -e "Host ${SYSTEM.LINUX_SERVER_HOST}\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config\n`
    bashContent += `rsync -avrz -e 'ssh -p ${SYSTEM.LINUX_SERVER_PORT}' --exclude "node_modules" /tmp/` + SYSTEM.NAME + '/build/ ' + SYSTEM.LINUX_SERVER_USERNAME + '@' + SYSTEM.LINUX_SERVER_HOST + ':' + sourcePath + '/build \n'
    bashContent += 'curl -X GET "' + SYSTEM.SCHEME + '://' + SYSTEM.DOMAIN + '/app/upload?platform=' + type + '&extended=x86-64&token=' + getHashToken() + '&startDate=' + startDate + '&logPath=' + logPath + '" -H "cache-control: no-cache"\n'
    writerStream.write('Run command: \n')
    writerStream.write(bashContent)

    const conn = new Client()
    conn.on('ready', function () {
      const writerStream = fs.createWriteStream(logPath, {flags: 'a'})
      writerStream.write('Client :: ready\n')
      conn.shell(function (err, stream) {
        if (err) throw err
        const writerStream = fs.createWriteStream(logPath, {flags: 'a'})
        stream.pipe(writerStream)
        stream.on('close', function () {
          const writerStream = fs.createWriteStream(logPath, {flags: 'a'})
          writerStream.write('\nStream :: close\n')
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
}

const linuxBuild = async (name, version, docker) => {
  await startDockerToBuild(name, version, 'linux', docker)
}

const winBuild = async (name, version, docker) => {
  await startDockerToBuild(name, version, 'win', docker)
}

const sleep = (s) => new Promise(resolve => setTimeout(resolve, s))

export default [
  {
    method: 'POST',
    path: `/build/webhooks`,
    config: {
      auth: false,
      tags: ['api', 'build'],
      description: 'Github webhook',
      validate: {
        headers: {
          'x-hub-signature': Joi.string().required().description('Github Secret.')
        },
        options: {
          allowUnknown: true
        }
      }
    },
    async handler (request) {
      try {
        const shaObj = new JsSHA('SHA-1', 'TEXT')
        shaObj.setHMACKey(SYSTEM.TOKEN, 'TEXT')
        shaObj.update(JSON.stringify(request.payload))
        const hash = shaObj.getHMAC('HEX')
        if (request.headers && request.headers['x-hub-signature'] === 'sha1=' + hash) {
          const updateCodeRes = await gitCodeUpdate(SYSTEM.BUILD_TYPE)
          if (updateCodeRes) {
            const packageJson = JSON.parse(fs.readFileSync(path.join(sourcePath, 'package.json'), 'utf-8'))

            if (packageJson && packageJson.name && packageJson.version) {
              const name = packageJson.name
              const version = packageJson.version
              if (SYSTEM.BUILD_TYPE.includes('mac')) {
                macBuild(name, version) // async
                await sleep(500)
              }

              if (SYSTEM.BUILD_TYPE.includes('linux')) {
                linuxBuild(name, version, this.docker) // async
                await sleep(500)
              }

              if (SYSTEM.BUILD_TYPE.includes('win')) {
                winBuild(name, version, this.docker) // async
              }
            } else {
              return this.fail(null, 10010, 'package read failed.')
            }
          } else {
            return this.fail(null, 10009, 'code update failed.')
          }

          return this.success('ok')
        } else {
          return this.fail()
        }
      } catch (err) {
        return this.fail(null, 10001, err.toString())
      }
    }
  }
]
