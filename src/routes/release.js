import Joi from 'joi'
import auth from '../lib/auth'

export default [
  {
    method: 'POST',
    path: '/app/release',
    options: {
      auth: false,
      tags: ['api', 'app'],
      description: 'The app release.',
      validate: {
        payload: Joi.object({
          token: Joi.string().required().description('Encrypted-Token'),
          name: Joi.string().required().description('The package.json name'),
          downloadUrl: Joi.string().required().description('Download URL'),
          version: Joi.string().required().description('APP version'),
          platform: Joi.string().required().description('Platform'),
          extended: Joi.string().required().description('Extended'),
          type: Joi.string().required().description('Type'),
          logPath: Joi.string().required().description('Log path'),
          author: Joi.string().description('Author'),
          authorEmail: Joi.string().description('Author Email'),
          message: Joi.string().description('Message')
        }).unknown()
      }
    },
    async handler (request) {
      if (!auth(request.payload.token)) {
        return this.fail(null, 403, 'Token Error.')
      }

      const data = request.payload
      data.releaseDate = new Date().getTime().toString()
      const result = this.$db.get('appLog').push(data).write()

      return this.success(result)
    }
  }
]
