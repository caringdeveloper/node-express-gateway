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

import { Request } from 'express'

export type Configuration = {
  port: number
  authentication?: Authentication
  auth0?: Auth0
  routes: Route[]
  aggregates: Aggregate[]
}

export type Authentication = {
  host: string
  port: number
  path: string
}

export type Auth0 = {
  jwks: string
  audiences: string[]
  issuer: string
}

export enum AuthType {
  UNDEFINED = 0,
  AUTH0 = 1,
  SELF_IMPLEMENTED = 2,
  API_KEY = 3,
}

export type Route = {
  downstreamPath: string
  downstreamHost: string
  downstreamPort: number
  downstreamSSL: boolean
  downstreamUrlSuffix: string
  upstreamPath: string
  upstreamMethods: string[]
  key: string
  scopes: string[]
  auth: AuthType
  rateLimit: boolean
  findTime: number
  maxRetry: number
}

export type Aggregate = {
  upstreamPath: string
  keys: string[]
  upstreamMethods: string[]
  auth: boolean
}

export interface GatewayRequest extends Request {
  user: any
}
