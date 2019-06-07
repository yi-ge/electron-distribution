import fs from 'fs'
import path from 'path'

const modules = []

const files = fs.readdirSync(__dirname).filter((file) => {
  return file.match(/\.(json|js)$/)
})

files.forEach(key => {
  if (key === 'index.js') return

  // const content = require(path.join(__dirname, key)).default
  const content = require(path.join(__dirname, key)).default

  if (Array.isArray(content)) { modules.push(...content) } else { modules.push(content) }
})

export default modules
