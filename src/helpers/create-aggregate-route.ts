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

import * as axios from "axios";
import * as pAll from "p-all";
import * as express from "express";
import { Configuration, Aggregate } from "../models/Configuration";

type AxiosPromise = () => Promise<axios.AxiosResponse>;

/**
 * Aggregate route which builds a facade for the client so that it can call
 * multiple routes at the same time without the hassle to manage that inside
 * the client implementation
 *
 * IMPORTANT: For now it just supports the aggregation of GET requests
 *
 */
const handleAggregateRoute = (
  config: Configuration,
  aggregate: Aggregate,
  method: string
) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Collecting routes that this aggregate consists of
  const { keys } = aggregate;
  const lazyPromises: AxiosPromise[] = [];
  let resolvedPromisesResults: any = {};

  keys.forEach(key => {
    // Create own HTTP requests and set the correct body according to the key of the route
    resolvedPromisesResults[key] = undefined;

    const route = config.routes.find(e => e.key === key);
    const URL = route.downstreamSSL
      ? "https://" + route.downstreamHost + ":" + route.downstreamPort
      : "http://" + route.downstreamHost + ":" + route.downstreamPort;

    lazyPromises.push(
      (): Promise<axios.AxiosResponse> => {
        if (method === "post" || method === "put" || method === "patch") {
          delete req.headers.host;

          return axios.default[method](URL, {
            data: req.body,
            headers: req.headers,
            params: req.params
          });
        } else {
          delete req.headers.host;

          return axios.default[method](URL, {
            headers: req.headers,
            params: req.params
          });
        }
      }
    );
  });

  const results = await pAll(lazyPromises, { concurrency: 5 });

  // Is it possible to handle that in a better manner?
  let i = 0;
  for (let prop in resolvedPromisesResults) {
    resolvedPromisesResults[prop] = results[i].data;
    i++;
  }

  return res.status(200).json(resolvedPromisesResults);
};

export default (app: express.Application, config: Configuration, aggregate: Aggregate): void => {
  aggregate.upstreamMethods.forEach(method => {
    app[method](aggregate.upstreamPath, handleAggregateRoute(config, aggregate, method));
  });
};
