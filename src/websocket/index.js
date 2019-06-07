import container from './container'
import git from './git'
import log from './log'
import JsSHA from 'jssha'
import {
  SYSTEM
} from '../config'

export default (io, docker) => {
  console.log('Websocket Runing...')
  io.on('connection', function (socket) {
    console.log('One user connected - ' + socket.id)
    socket.emit('requireAuth', 'distribution')
    socket.emit('opend', new Date())

    socket.on('auth', function (token) {
      const shaObj = new JsSHA('SHA-512', 'TEXT')
      shaObj.update(SYSTEM.TOKEN)
      const hash = shaObj.getHash('HEX')
      if (token === hash) {
        container(io, socket, docker)
        git(io, socket, docker)
        log(io, socket, docker)
        socket.emit('auth', 'success')
      } else {
        socket.emit('auth', 'fail')
      }
    })
  })
}
