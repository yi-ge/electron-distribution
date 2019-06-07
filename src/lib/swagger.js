import inert from 'inert'
import vision from 'vision'
import hapiSwagger from 'hapi-swagger'
import { SYSTEM } from '../config'
import pack from '../../package'

const swaggerOptions = {
  schemes: SYSTEM.SCHEME,
  info: {
    title: 'Electron Distribution',
    version: pack.version
  },
  grouping: 'tags',
  tags: [
    {
      name: 'app',
      description: 'App Distribution'
    },
    {
      name: 'build',
      description: 'APP Buils'
    }
  ]
}

export default [
  inert,
  vision,
  {
    plugin: hapiSwagger,
    options: swaggerOptions
  }
]
