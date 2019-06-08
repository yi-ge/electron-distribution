import hapi from 'hapi'
import swagger from './lib/swagger'
import {
  SERVER,
  SYSTEM
} from './config'
import routes from './routes'
import db from './lib/db'
import moment from 'moment-timezone'
import SocketIO from 'socket.io'
import websocket from './websocket'
import DockerOde from 'dockerode'
import fs from 'fs'

;(async () => {
  const socketPath = SYSTEM.DOCKER_SOCKET
  const stats = fs.statSync(socketPath)

  if (!stats.isSocket()) {
    console.log('Docker can\'t connect.')
  }

  const docker = new DockerOde({
    socketPath: socketPath
  })

  const checkDockerEnv = async () => {
    try {
      const r = await docker.info()
      if (r.Architecture !== 'x86_64') {
        console.log('Require x86-64 system.')
      }
    } catch (err) {
      console.log('Please make sure Docker is working.')
    }

    try {
      const r = await docker.version()
      if (r.Version.split('.')[0] < 18) {
        console.log('Require Docker 18+ .')
      }
    } catch (err) {
      console.log('Error: ' + err.toString())
    }

    console.log('Docker Runding...')
  }

  checkDockerEnv()

  const server = hapi.server(SERVER)

  await server.register([
    ...swagger
  ])

  try {
    server.bind({
      docker,
      $db: db,
      $moment: moment,
      /**
       * send success data
       */
      success (data, status = 1, msg) {
        return {
          status,
          msg,
          result: data
        }
      },
      /**
       * send fail data
       */
      fail (data, status = 10000, msg) {
        return {
          status,
          msg,
          result: data
        }
      }
    })
    server.route(routes)
    await server.start()

    const io = SocketIO.listen(server.listener)

    server.bind({
      io
    })

    websocket(io, docker)

    console.log('Server running at:', server.info.uri)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
})()
