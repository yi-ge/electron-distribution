import { Transform } from 'stream'
import chalk from 'chalk'

const WIN_IMAGE_NAME = 'electronuserland/builder:wine-mono'
const LINUX_IMAGE_NAME = 'electronuserland/builder:10'

export default (io, socket, docker) => {
  socket.on('exec', function (id, w, h) {
    var container = docker.getContainer(id)
    var cmd = {
      'AttachStdout': true,
      'AttachStderr': true,
      'AttachStdin': true,
      'Tty': true,
      Cmd: ['/bin/bash']
    }
    container.exec(cmd, (err, exec) => {
      var options = {
        'Tty': true,
        stream: true,
        stdin: true,
        stdout: true,
        stderr: true,
        // fix vim
        hijack: true
      }

      container.wait((err, data) => {
        console.log(err)
        socket.emit('end', 'ended')
      })

      if (err) {
        return
      }

      exec.start(options, (err, stream) => {
        console.log(err)
        var dimensions = {
          h,
          w
        }
        if (dimensions.h !== 0 && dimensions.w !== 0) {
          exec.resize(dimensions, () => {})
        }

        stream.on('data', (chunk) => {
          socket.emit('show', chunk.toString())
        })

        socket.on('cmd', (data) => {
          stream.write(data)
        })
      })
    })
  })

  socket.on('logs', function (id) {
    const container = docker.getContainer(id)

    const logsOpts = {
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: false
    }

    container.logs(logsOpts, (err, stream) => {
      if (err) {
        console.log(err)
        socket.emit('err', chalk.red('Error:\n') + err + '.\n')
        return
      }

      stream.on('data', (data) => { socket.emit('show', data.toString('utf-8')) })
      stream.on('end', function () {
        socket.emit('show', '\n===Stream finished===\n')
        stream.destroy()
      })
    })
  })

  socket.on('pull', function (type) {
    let imageName = null
    switch (type) {
      case 'win':
        imageName = WIN_IMAGE_NAME
        break
      case 'linux':
        imageName = LINUX_IMAGE_NAME
        break
    }

    docker.pull(imageName, function (err, stream) {
      if (err) {
        console.log(err)
        socket.emit('err', chalk.red('Error:\n') + err + '.\n')
        return
      }

      const bytesToSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1000 // or 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i]
      }

      let downTmp = []
      let downTmpId = []
      const commaSplitter = new Transform({
        readableObjectMode: true,
        transform (chunk, encoding, callback) {
          let tmp = ''
          try {
            var result = chunk.toString().match(/{(.*)}/)
            result = result ? result[0] : null
            if (!result) callback()
            tmp = JSON.parse(result)
            if (tmp.id) {
              if (downTmpId.includes(tmp.id)) {
                for (const n in downTmp) {
                  if (downTmp[n].id === tmp.id) {
                    if (tmp.progressDetail && tmp.progressDetail.current && tmp.progressDetail.total) {
                      const percentage = Math.floor(100 * tmp.progressDetail.current / tmp.progressDetail.total)
                      downTmp[n].val = ': [' + percentage + '%] Total ' + bytesToSize(tmp.progressDetail.total)
                    } else if (tmp.status) {
                      downTmp[n].val = ': ' + tmp.status
                    }
                  }
                }
              } else {
                downTmpId.push(tmp.id)
                const temp = {}
                temp.id = tmp.id
                if (tmp.progressDetail && tmp.progressDetail.current && tmp.progressDetail.total) {
                  const percentage = Math.floor(100 * tmp.progressDetail.current / tmp.progressDetail.total)
                  temp.val = ': [' + percentage + '%] Total ' + bytesToSize(tmp.progressDetail.total)
                } else if (tmp.status) {
                  temp.val = ': ' + tmp.status
                }
                downTmp.push(temp)
              }

              let str = ''
              for (const n in downTmp) {
                str += downTmp[n].id + downTmp[n].val + '\n'
              }
              socket.emit('progress', str)
            }
          } catch (err) {
            // console.log(err)
          }

          callback()
        }
      })

      stream.pipe(commaSplitter)
      stream.once('end', () => {
        socket.emit('progress', chalk.green('All: [100%] Finish。\n'))
        // socket.emit('end', imageName + ' install ' + chalk.green('success') + '.\n')
        downTmp = []
        downTmpId = []
      })
    })
  })
}
