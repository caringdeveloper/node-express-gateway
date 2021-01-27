/*
    Copyright(c) 2019 Erek Röös. All rights reserved.

    The MIT License(MIT)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files(the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and / or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
*/

import axios from 'axios'
import pathToRegexp from 'path-to-regexp'
import { injectable, inject } from 'inversify'
import { Application, Request, Response, NextFunction } from 'express'

import IRouteGenerator from './IRouteGenerator'
import IConfigurationProvider from './IConfigurationProvider'
import { Route, Configuration, GatewayRequest, AuthType } from './models/Configuration'
import IAuthenticator from './middleware/IAuthenticator'
import IAuthorizer from './middleware/IAuthorizer'
import IUserInformation from './middleware/IUserInformation'
import diContainer from './DiContainer'
import { UnauthorizedError } from 'express-jwt'

@injectable()
export default class RouteGenerator implements IRouteGenerator {
  @inject('ConfigurationProvider')
  private configurationProvider: IConfigurationProvider

  @inject('Authorizer')
  private authorizer: IAuthorizer

  @inject('UserInformation')
  private userInformation: IUserInformation

  private configuration: Configuration = undefined
  private app: Application = undefined

  public injectAppInstance(app: Application) {
    this.app = app
  }

  public async createProxyRoute(route: Route): Promise<void> {
    if (!this.configuration)
      this.configuration = await this.configurationProvider.getConfiguration()

    const toPath = pathToRegexp.compile(route.downstreamPath)

    const routeProxy = (method: string) => async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        let URL = route.downstreamSSL
          ? 'https://' + route.downstreamHost + ':' + route.downstreamPort
          : 'http://' + route.downstreamHost + ':' + route.downstreamPort

        URL += toPath(req.params)
        URL += req.url.split('?')[1] !== undefined ? '?' + req.url.split('?')[1] : ''

        if (route.downstreamUrlSuffix) {
          // const parts = req.url.split('?')
          // let queryString = parts[1]

          URL += req.query ? '&' + route.downstreamUrlSuffix : '?' + route.downstreamUrlSuffix
        }

        let data
        if (method === 'post' || method === 'put' || method === 'patch') {
          delete req.headers.host

          const response = await axios[method](URL, req.body, {
            headers: {
              ...req.headers,
              'x-user-info': JSON.stringify(req['user'] || null),
              'Cache-Control': 'no-cache',
            },
            // params: req.query,
          })

          data = response.data
        } else {
          delete req.headers.host

          const response = await axios[method](URL, {
            headers: {
              ...req.headers,
              'x-user-info': JSON.stringify(req['user'] || null),
              'Cache-Control': 'no-cache',
            },
            // params: req.query,
          })

          data = response.data
        }

        if (typeof data === 'string') {
          res.status(200).send(data)
        } else {
          return res.status(200).json(data)
        }
      } catch (err) {
        const filteredError = {
          Address: `${err.address}:${err.port}`,
          ToUrl: err.config.url,
          StatusCode: err.response && err.response.status,
          Headers: err.config.headers.authorization,
          Method: err.config.method,
          Params: err.config.params,
          Body: err.response && err.response.body,
          Data: err.response && err.response.data,
        }

        if (err.response && err.response.status) {
          return res.status(err.response.status).send(err.response.data)
        }

        console.log(err)
        return res.status(500).json(err)
      }
    }

    let middleware: Function[] = []

    if (route.auth !== AuthType.UNDEFINED) {
      // Setting the correct authentication strategy per route.
      // It is possible that different routes need different authentication strategies and
      // therefore we should be able to register differen strategies.
      // To make this possible we always new up a new object to make sure
      // that every route has its own authenticator available
      let authenticator: IAuthenticator

      switch (route.auth) {
        case AuthType.AUTH0:
          authenticator = diContainer.get<IAuthenticator>('Auth0Authenticator')
          break

        case AuthType.SELF_IMPLEMENTED:
          authenticator = diContainer.get<IAuthenticator>('Authenticator')
          break
      }

      middleware.push(authenticator.authenticate)
      if (route.scopes) middleware.push(this.authorizer.authorize(route.scopes))
    } else {
      middleware.push(this.userInformation.buildUser)
    }

    route.upstreamMethods.forEach((method) => {
      this.app[method](route.upstreamPath, middleware, routeProxy(method))
    })

    this.app.use((err, req, res, next) => {
      if (err && err instanceof UnauthorizedError) {
        res.status(err.status)
        res.send(err.message)
      }

      res.end()
    })
  }

  public createAggregateRoute(route: Route): void {
    throw new Error('Method not implemented.')
  }
}
