/**
 * Copyright (C) CODUCT GmbH - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 * Written by Erek Röös <erek.roeoes@coduct.com>, 2019
 */

import * as axios from "axios";
import * as express from "express";
import { Configuration, Route } from "../models/Configuration";
import * as pathToRegexp from "path-to-regexp";

const authentication = require("../middleware/authentication");
const authorization = require("../middleware/authorization");

export default (app: express.Application, config: Configuration, route: Route): void => {
  // Factory for a path function that can be used inside the routeProxy
  const toPath = pathToRegexp.compile(route.downstreamPath);

  let URL = route.downstreamSSL
    ? "https://" + route.downstreamHost + ":" + route.downstreamPort
    : "http://" + route.downstreamHost + ":" + route.downstreamPort;

  const routeProxy = (method: string) => async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      URL += toPath(req.params);

      if (route.downstreamUrlSuffix) {
        const parts = req.url.split("?");
        let queryString = parts[1];

        URL +=
          parts[0] +
          (queryString ? "?" + queryString + "&" + route.downstreamUrlSuffix : "?" + route.downstreamUrlSuffix);
      }

      console.log("[DEBUG]", "URL", URL);

      let data;
      if (method === "post" || method === "put" || method === "patch") {
        delete req.headers.host;

        const response = await axios.default[method](URL, {
          data: req.body,
          headers: req.headers,
          params: req.query
        });

        data = response.data;
      } else {
        delete req.headers.host;

        const response = await axios.default[method](URL, {
          headers: req.headers,
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
      return res.status(err.response.status).send(err.response.data);
    }
  };

  if (!route.auth) {
    route.upstreamMethods.forEach(method => {
      app[method](route.upstreamPath, routeProxy(method));
    });
  } else {
    route.upstreamMethods.forEach(method => {
      app[method](route.upstreamPath, authentication(config), authorization(route.scopes), routeProxy(method));
    });
  }
};
