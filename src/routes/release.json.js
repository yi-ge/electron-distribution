export default [
  {
    method: 'GET',
    path: `/app/release.json`,
    config: {
      auth: false,
      tags: ['api', 'app'],
      description: 'Get new JSON about MAC update.'
    },
    async handler () {
      const maczipLast = this.$db.get('appLog')
        .filter({type: 'maczip'})
        .sortBy((item) => -item.releaseDate)
        .take()
        .first()
        .value()

      return maczipLast ? {
        'url': maczipLast.downloadUrl,
        'name': maczipLast.name,
        'notes': maczipLast.message,
        'pub_date': this.$moment(maczipLast.releaseDate).tz('Asia/Shanghai').format()
      } : {}
    }
  }
]
