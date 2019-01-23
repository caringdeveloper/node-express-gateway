const axios = require('axios').default
const pAll = require('p-all')

/**
 * Aggregate route which builds a facade for the client so that it can call
 * multiple routes at the same time without the hassle to manage that inside
 * the client implementation
 *
 * IMPORTANT: For now it just supports the aggregation of GET requests
 *
 * @param {any} config THe proxy configuration
 * @param {any} aggregate The aggregate definition
 * @param {string} method The HTTP method that should be executed
 *
 * @returns {Promise<function>} An express middleware function
 */
const handleAggregateRoute = (config, aggregate, method) => async (req, res, next) => {
  // Collecting routes that this aggregate consists of
  const { keys } = aggregate
  const lazyPromises = []
  let resolvedPromisesResults = {}

  keys.forEach(key => {
    // Create own HTTP requests and set the correct body according to the key of the route
    resolvedPromisesResults[key] = undefined

    const route = config.routes.find(e => e.key === key)
    const URL = route.downstreamSSL
      ? 'https://' + route.downstreamHost + ':' + route.downstreamPort
      : 'http://' + route.downstreamHost + ':' + route.downstreamPort

    lazyPromises.push(() => {
      if (method === 'post' || method === 'put' || method === 'patch') {
        delete req.headers.host

        return axios[method](URL, {
          data: req.body,
          headers: req.headers,
          params: req.params
        })
      } else {
        delete req.headers.host

        return axios[method](URL, {
          headers: req.headers,
          params: req.params
        })
      }
    })
  })

  const results = await pAll(lazyPromises, { concurrency: 5 })

  // Is it possible to handle that in a better manner?
  let i = 0
  for (let prop in resolvedPromisesResults) {
    resolvedPromisesResults[prop] = results[i].data
    i++
  }

  return res.status(200).json(resolvedPromisesResults)
}

module.exports = (app, config, aggregate) => {
  aggregate.upstreamMethods.forEach(method => {
    app[method](aggregate.upstreamPath, handleAggregateRoute(config, aggregate, method))
  })
}
