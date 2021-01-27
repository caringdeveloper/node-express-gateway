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
import jwt from 'express-jwt'
import { inject, injectable } from 'inversify'
import jwks from 'jwks-rsa'
import IConfigurationProvider from '../IConfigurationProvider'

import IAuthenticator from './IAuthenticator'

@injectable()
export class Auth0Authenticator implements IAuthenticator {
  constructor(
    @inject('ConfigurationProvider') private _configurationProvicer: IConfigurationProvider
  ) {}

  async authenticate(req: any, res: any, next: any): Promise<any> {
    const config = this._configurationProvicer.getConfiguration()
    const auth0Authenticator = jwt({
      secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: config.auth0?.jwks ?? '',
      }),
      audience: config.auth0?.audiences ?? [],
      issuer: config.auth0?.issuer ?? '',
      algorithms: ['RS256'],
    })

    return auth0Authenticator(req, res, next)
  }
}
