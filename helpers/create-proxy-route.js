const axios = require('axios').default

const authentication = require('../middleware/authentication')
const authorization = require('../middleware/authorization')

module.exports = (app, config, route) => {
  let URL = route.downstreamSSL
    ? 'https://' + route.downstreamHost + ':' + route.downstreamPort
    : 'http://' + route.downstreamHost + ':' + route.downstreamPort

  const routeProxy = method => async (req, res, next) => {
    try {
      if (route.downstreamUrlSuffix) {
        const parts = req.url.split('?')
        let queryString = parts[1]

        URL +=
          parts[0] +
          (queryString ? '?' + queryString + '&' + route.downstreamUrlSuffix : '?' + route.downstreamUrlSuffix)
      }

      let data
      if (method === 'post' || method === 'put' || method === 'patch') {
        data = await axios[method](URL, {
          data: req.body
        }).data
      } else {
        data = await axios[method](URL).data
      }

      if (typeof data === 'string') {
        res.status(200).send(data)
      } else {
        return res.status(200).json(data)
      }
    } catch (err) {
      console.log('[ERROR]', err)
      return res.status(500).send()
    }
  }

  if (!route.auth) {
    route.upstreamMethods.forEach(method => {
      app[method](route.upstreamPath, routeProxy(method))
    })
  } else {
    route.upstreamMethods.forEach(method => {
      app[method](route.upstreamPath, authentication(config), authorization(route.scopes), routeProxy(method))
    })
  }
}
