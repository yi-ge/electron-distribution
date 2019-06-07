import fs from 'fs'
import db from '../lib/db'

export default (io, socket, docker) => {
  socket.on('log', function (path) {
    path = decodeURI(path)

    const logLast = db.get('buildLog')
      .filter({logPath: path})
      .sortBy((item) => -item.startDate)
      .take()
      .first()
      .value()

    if (logLast && logLast.logPath) {
      try {
        socket.emit('show', fs.readFileSync(logLast.logPath) + '\n')
      } catch (err) {
        socket.emit('show', err.toString() + '\n')
      }
    } else {
      socket.emit('show', 'No file.')
    }
  })
}
