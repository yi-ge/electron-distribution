import fs from 'fs'
import Joi from 'joi'

export default [
  {
    method: 'GET',
    path: '/build/log.log',
    options: {
      auth: false,
      tags: ['api', 'build'],
      description: 'Get build log.',
      validate: {
        query: Joi.object({
          path: Joi.string().required().description('Log path.')
        }).unknown()
      }
    },
    async handler (request) {
      const path = decodeURI(request.query.path)

      const logLast = this.$db.get('appLog')
        .filter({ logPath: path })
        .sortBy((item) => -item.releaseDate)
        .take()
        .first()
        .value()

      if (logLast && logLast.logPath) {
        try {
          return fs.readFileSync(logLast.logPath)
        } catch (err) {
          return this.fail(err)
        }
      } else {
        return this.fail(null, 10001, 'No file.')
      }
    }
  }
]
