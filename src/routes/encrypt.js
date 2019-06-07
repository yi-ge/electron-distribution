import Joi from 'joi'
import JsSHA from 'jssha'

export default [{
  method: 'GET',
  path: `/app/encrypt`,
  config: {
    auth: false,
    tags: ['api', 'app'],
    description: 'Token encrypt service.',
    validate: {
      query: {
        token: Joi.string().required().description('Token')
      }
    }
  },
  async handler (request) {
    const shaObj = new JsSHA('SHA-512', 'TEXT')
    shaObj.update(request.query.token)
    return this.success(shaObj.getHash('HEX'))
  }
}]
