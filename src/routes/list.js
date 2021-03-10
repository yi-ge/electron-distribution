import Joi from 'joi'
import { SYSTEM } from '../config'
import auth from '../lib/auth'

export default [{
  method: 'GET',
  path: '/app/list/release',
  options: {
    auth: false,
    tags: ['api', 'app'],
    description: 'App release log list.',
    validate: {
      query: Joi.object({
        token: Joi.string().required().description('Encrypted-Token')
      }).unknown()
    }
  },
  async handler (request) {
    if (!auth(request.query.token)) {
      return this.fail(null, 403, 'Token Error.')
    }
    return this.success({
      name: SYSTEM.NAME,
      list: this.$db.get('appLog') // .filter(o => o.type !== 'maczip')
        .sortBy((item) => -item.releaseDate)
        .value()
    })
  }
},
{
  method: 'GET',
  path: '/app/list/build',
  config: {
    auth: false,
    tags: ['api', 'app'],
    description: 'App build log list.',
    validate: {
      query: Joi.object({
        token: Joi.string().required().description('Encrypted-Token')
      }).unknown()
    }
  },
  async handler (request) {
    if (!auth(request.query.token)) {
      return this.fail(null, 403, 'Token Error.')
    }
    return this.success({
      name: SYSTEM.NAME,
      list: this.$db.get('buildLog')
        .sortBy((item) => -item.startDate)
        .value()
    })
  }
}]
