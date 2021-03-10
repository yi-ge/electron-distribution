import Joi from 'joi'
import path from 'path'
import { SYSTEM, COS, OSS, QINIU } from '../config'
import axios from 'axios'

export default [
  {
    method: 'GET',
    path: '/app/nupkg/{version}/{releases}',
    options: {
      auth: false,
      tags: ['api', 'app'],
      description: 'RELEASES file or download pukge.',
      validate: {
        params: Joi.object({
          version: Joi.string().required().description('Version'),
          releases: Joi.string().required().description('RELEASES file or File name')
        })
      }
    },
    async handler (request, h) {
      const version = request.params.version
      const releases = request.params.releases

      let objectStorageUrl = ''
      switch (SYSTEM.OBJECT_STORAGE_TYPE) {
        case 'cos':
          objectStorageUrl = COS.url
          break
        case 'oss':
          objectStorageUrl = OSS.url
          break
        case 'qiniu':
          objectStorageUrl = QINIU.url
          break
      }

      if (releases === 'RELEASES' || releases === 'releases') {
        // TODO: ?id=name&localVersion=4.7.2&arch=amd64
        const nupkgLast = this.$db.get('appLog')
          .filter({ type: 'RELEASES', version })
          .sortBy((item) => -item.releaseDate)
          .take()
          .first()
          .value()

        if (nupkgLast) {
          const RELEASESname = path.join('RELEASES-' + version, 'RELEASES')
          const url = objectStorageUrl + '/app/' + nupkgLast.name + '/' + version + '/' + RELEASESname

          try {
            const { data } = await axios.get(url)
            return data
          } catch (err) {
            console.log(err)
            return ''
          }
        }
      } else {
        const fileName = releases
        const nupkgLast = this.$db.get('appLog')
          .filter({ type: 'nupkg', version })
          .sortBy((item) => -item.releaseDate)
          .take()
          .first()
          .value()

        if (nupkgLast) {
          return h.redirect(objectStorageUrl + '/app/' + nupkgLast.name + '/' + version + '/' + fileName)
        } else {
          return ''
        }
      }

      return this.fail()
    }
  }
]
