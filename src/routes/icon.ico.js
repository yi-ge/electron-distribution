export default [{
  method: 'GET',
  path: `/app/icon.ico`,
  config: {
    auth: false,
    tags: ['api', 'app'],
    description: 'Squirrel windows icon.'
  },
  handler (request, h) {
    return h.file('public/icon.ico')
  }
}]
