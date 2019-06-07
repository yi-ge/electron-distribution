import git from 'simple-git'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { SYSTEM } from '../config'

const GIT_SSH_COMMAND = 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'

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

export default (io, socket, docker) => {
  socket.on('gitPull', (data) => {
    const repoPath = SYSTEM.REPOPATH
    const workPath = SYSTEM.WORKPATH
    const sourcePath = path.join(workPath, '/source')
    const linuxPath = path.join(workPath, '/linux')
    const winPath = path.join(workPath, '/win')

    const gitClone = (repoPath, workPath, type) => {
      git().env({
        ...process.env,
        GIT_SSH_COMMAND
      })
        .clone(repoPath, workPath, (err) => {
          if (err) {
            socket.emit('err', chalk.red(type + ' clone error:\n') + err + '\n')
            return
          }
          socket.emit('show', chalk.green(type + ' clone is finished!\n'))
        })
    }

    const gitPull = (workPath, type) => {
      git(workPath).env({
        ...process.env,
        GIT_SSH_COMMAND
      })
        .pull((err, update) => {
          if (err) {
            socket.emit('err', chalk.red(type + ' pull error:\n') + err + '\n')
            return
          }
          if (update && update.summary.changes) {
            socket.emit('show', chalk.green(type + ' update success.\n'))
          } else {
            socket.emit('show', chalk.green(type + ' update success, no change.\n'))
          }
        })
    }

    if (!fs.existsSync(sourcePath)) {
      mkdirsSync(sourcePath)
      gitClone(repoPath, sourcePath, 'Source')
    } else {
      if (fs.readdirSync(sourcePath).includes('.git')) {
        gitPull(sourcePath, 'Source')
      } else {
        gitClone(repoPath, sourcePath, 'Source')
      }
    }

    if (!fs.existsSync(linuxPath)) {
      mkdirsSync(linuxPath)
      gitClone(repoPath, linuxPath, 'Linux')
    } else {
      if (fs.readdirSync(linuxPath).includes('.git')) {
        gitPull(linuxPath, 'Linux')
      } else {
        gitClone(repoPath, linuxPath, 'Linux')
      }
    }

    if (!fs.existsSync(winPath)) {
      mkdirsSync(winPath)
      gitClone(repoPath, winPath, 'Win')
    } else {
      if (fs.readdirSync(winPath).includes('.git')) {
        gitPull(winPath, 'Win')
      } else {
        gitClone(repoPath, winPath, 'Win')
      }
    }
  })
}
