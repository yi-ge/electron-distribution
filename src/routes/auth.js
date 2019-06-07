import Joi from 'joi'
import { SYSTEM } from '../config'
import auth from '../lib/auth'

export default [{
  method: 'GET',
  path: `/app/auth`,
  config: {
    auth: false,
    tags: ['api', 'app'],
    description: 'Check token.',
    validate: {
      query: {
        token: Joi.string().required().description('Encrypted-Token')
      }
    }
  },
  async handler (request) {
    if (auth(request.query.token)) {
      return this.success({
        buildType: SYSTEM.BUILD_TYPE
      })
    }
    return this.fail(null, 403, 'Token Error.')
  }
}]
