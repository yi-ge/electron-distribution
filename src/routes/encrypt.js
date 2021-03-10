import Joi from 'joi'
import JsSHA from 'jssha'

export default [{
  method: 'GET',
  path: '/app/encrypt',
  options: {
    auth: false,
    tags: ['api', 'app'],
    description: 'Token encrypt service.',
    validate: {
      query: Joi.object({
        token: Joi.string().required().description('Token')
      }).unknown()
    }
  },
  async handler (request) {
    const shaObj = new JsSHA('SHA-512', 'TEXT')
    shaObj.update(request.query.token)
    return this.success(shaObj.getHash('HEX'))
  }
}]
