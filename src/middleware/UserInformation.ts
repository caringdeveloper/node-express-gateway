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

import express from 'express'
import { injectable } from 'inversify'
import jwt from 'jsonwebtoken'
import IUserInformation from './IUserInformation'

const { JWT_SECRET_KEY } = process.env

@injectable()
export default class UserInformation implements IUserInformation {
  public async buildUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    // For now the authentication middleware will only support Bearer JWT Token authentication
    const authenticationString = req.headers.authorization

    if (!authenticationString) return next()

    const token = authenticationString.split(' ')[1]

    let decodedToken
    try {
      decodedToken = jwt.verify(token, JWT_SECRET_KEY)
    } catch (err) {
      return next()
    }

    // Token is not valid
    if (!decodedToken) return next()

    req['user'] = {
      id: decodedToken.id,
      scopes: decodedToken.scope,
      token,
    }

    return next()
  }
}
