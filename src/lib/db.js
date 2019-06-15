import low from 'lowdb'
import path from 'path'
import FileSync from 'lowdb/adapters/FileSync'
import { SYSTEM } from '../config'

const isDev = process.env.NODE_ENV ? process.env.NODE_ENV === 'development' : false
const adapter = new FileSync(isDev ? path.join(SYSTEM.NAME + '-distribution-db.json') : path.join(SYSTEM.WORKPATH, SYSTEM.NAME + '-distribution-db.json'))
const db = low(adapter)

if (!db.get('appLog').value()) {
  db.defaults({ appLog: [], buildLog: [] }).write()
}

export default db
