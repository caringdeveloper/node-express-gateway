/**
 * Copyright (C) CODUCT GmbH - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 * Written by Erek Röös <erek.roeoes@coduct.com>, 2019
 */

import * as axios from "axios";
import { Request, Response, NextFunction, Application } from "express";
import * as pathToRegexp from "path-to-regexp";
import * as rateLimit from "express-rate-limit";

import { Configuration, Route } from "../models/Configuration";
import { authentication } from "../middleware/authentication";
import { authorization } from "../middleware/authorization";

export default (app: Application, config: Configuration, route: Route): void => {
  // Factory for a path function that can be used inside the routeProxy
  const toPath = pathToRegexp.compile(route.downstreamPath);

  const routeProxy = (method: string) => async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let URL = route.downstreamSSL
        ? "https://" + route.downstreamHost + ":" + route.downstreamPort
        : "http://" + route.downstreamHost + ":" + route.downstreamPort;

      URL += toPath(req.params);
      URL += req.url.split("?")[1] !== undefined ? "?" + req.url.split("?")[1] : "";

      if (route.downstreamUrlSuffix) {
        const parts = req.url.split("?");
        let queryString = parts[1];

        URL +=
          parts[0] +
          (queryString
            ? "?" + queryString + "&" + route.downstreamUrlSuffix
            : "?" + route.downstreamUrlSuffix);
      }

      console.log("[DEBUG]", "URL", URL);

      let data;
      if (method === "post" || method === "put" || method === "patch") {
        delete req.headers.host;

        const response = await axios.default[method](URL, req.body, {
          headers: {
            ...req.headers,
            "x-user-info": JSON.stringify(req["user"] || null),
            "Cache-Control": "no-cache"
          },
          params: req.query
        });

        data = response.data;
      } else {
        delete req.headers.host;

        const response = await axios.default[method](URL, {
          headers: {
            ...req.headers,
            "x-user-info": JSON.stringify(req["user"] || null),
            "Cache-Control": "no-cache"
          },
          params: req.query
        });

        data = response.data;
      }

      if (typeof data === "string") {
        res.status(200).send(data);
      } else {
        return res.status(200).json(data);
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
        Data: err.response && err.response.data
      };
      console.log("[ERROR - CREATE-PROXY-ROUTE]", filteredError);
      if (err.response && err.response.status) {
        return res.status(err.response.status).send(err.response.data);
      }

      return res.status(500).send();
    }
  };

  // apply middlewares
  let middlewares: Function[] = [];

  if (route.auth) {
    middlewares.push(authentication(config));
    middlewares.push(authorization(route.scopes));
  }
  if (route.ratelimit) {
    // Create our ratelimiter with given configuration
    const limiter = new rateLimit({
      windowMs: route.findTime * 60 * 1000,
      max: route.maxRetry,
      message: "Slow down, BOI!",
      onLimitReached: (req, res, options) => {
        console.log("Ratelimit hit on", route.upstreamMethods);
      }
    });

    middlewares.push(limiter);
  }

  route.upstreamMethods.forEach(method => {
    app[method](route.upstreamPath, middlewares, routeProxy(method));
  });
};
