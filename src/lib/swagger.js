import inert from '@hapi/inert'
import vision from '@hapi/vision'
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
      description: 'APP Builds'
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
