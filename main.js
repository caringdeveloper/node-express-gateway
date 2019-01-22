require('dotenv').config()

const fs = require('fs')
const express = require('express')
const yaml = require('yaml')
const cors = require('cors')

const createProxyRoute = require('./helpers/create-proxy-route')
const createAggregateRoute = require('./helpers/create-aggregate-route')

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
 * Application kickoff
 */
try {
  const config = readConfiguration('./config.yaml')

  // Installing global middleware
  app.use(cors())

  // Building the reverse proxy facade
  if (config.routes) config.routes.forEach(route => createProxyRoute(app, config, route))
  if (config.aggregates) config.aggregates.forEach(aggregate => createAggregateRoute(app, config, aggregate))

  app.listen(config.port, () => console.log('[INFO]', 'Gateway is listening'))
} catch (err) {
  console.log('[ERROR]', err)
}
