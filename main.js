require('dotenv').config()

const fs = require('fs')
const express = require('express')
const proxy = require('express-http-proxy')
const yaml = require('yaml')
const cors = require('cors')

const authentication = require('./middleware/authentication')
const authorization = require('./middleware/authorization')

const app = express()

/**
 * Reads the configuration file provided in yaml format and builds
 * an API Gateway out of it
 * @param {string} configurationFilePath Contains the configuration of the gateway
 */
const readConfiguration = configurationFilePath => {
  const configurationFile = fs.readFileSync(configurationFilePath, 'utf-8')
  return yaml.parse(configurationFile)
}

/**
 * Builds proxy routes out of the given route definition
 * @param {any} route The route definition
 */
const createProxyRoute = (config, route) => {
  const URL = route.downstreamSSL
    ? 'https://' + route.downstreamHost + ':' + route.downstreamPort
    : 'http://' + route.downstreamHost + ':' + route.downstreamPort

  let routeProxy
  if (route.downstreamURLsuffix) {
    routeProxy = proxy(URL, {
      proxyReqPathResolver: req => {
        const parts = req.url.split('?')
        let queryString = parts[1]

        console.log(
          '[DEBUG]',
          'Modified URL',
          parts[0] +
            (queryString ? '?' + queryString + '&' + route.downstreamURLsuffix : '?' + route.downstreamURLsuffix)
        )

        return (
          parts[0] +
          (queryString ? '?' + queryString + '&' + route.downstreamURLsuffix : '?' + route.downstreamURLsuffix)
        )
      }
    })
  } else {
    routeProxy = proxy(URL)
  }

  if (!route.auth) {
    route.upstreamMethods.forEach(method => {
      // app[method](route.upstreamPath, (req, res, next) => routeProxy.proxy(req, res, next))
      app[method](route.upstreamPath, routeProxy)
    })
  } else {
    console.log('[DEBUG]', 'Route', route)
    route.upstreamMethods.forEach(method => {
      app[method](route.upstreamPath, authentication(config), authorization(route.scopes), routeProxy)
    })
  }
}

/**
 * Application kickoff
 */
try {
  const config = readConfiguration('./config.yaml')

  // Installing global middleware
  app.use(cors())

  // Building the reverse proxy facade
  if (config.routes) config.routes.forEach(route => createProxyRoute(config, route))

  app.listen(config.port, () => console.log('[INFO]', 'Gateway is listening'))
} catch (err) {
  console.log('[ERROR]', err)
}
