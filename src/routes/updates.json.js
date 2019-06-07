import { SYSTEM } from '../config'

export default [{
  method: 'GET',
  path: `/app/updates.json`,
  config: {
    auth: false,
    tags: ['api', 'app'],
    description: 'Update check JSON.'
  },
  async handler () {
    const macLast = this.$db.get('appLog')
      .filter({
        platform: 'mac',
        type: 'install'
      })
      .sortBy((item) => -item.releaseDate)
      .take()
      .first()
      .value()

    const winLast = this.$db.get('appLog')
      .filter({
        platform: 'win',
        type: 'install'
      })
      .sortBy((item) => -item.releaseDate)
      .take()
      .first()
      .value()

    const linuxLast = this.$db.get('appLog')
      .filter({
        platform: 'linux',
        type: 'install'
      })
      .sortBy((item) => -item.releaseDate)
      .take()
      .first()
      .value()

    return {
      'win32-x64-prod': winLast ? {
        'readme': winLast.name,
        'update': SYSTEM.SCHEME + '://' + SYSTEM.DOMAIN + '/app/nupkg/' + winLast.version,
        'install': winLast.downloadUrl,
        'version': winLast.version
      } : {},
      'darwin-x64-prod': macLast ? {
        'readme': macLast.name,
        'update': SYSTEM.SCHEME + '://' + SYSTEM.DOMAIN + '/app/release.json',
        'install': macLast.downloadUrl,
        'version': macLast.version
      } : {},
      'linux-x64-prod': linuxLast ? {
        'update': linuxLast.downloadUrl,
        'install': linuxLast.downloadUrl,
        'version': linuxLast.version
      } : {}
    }
  }
}]
