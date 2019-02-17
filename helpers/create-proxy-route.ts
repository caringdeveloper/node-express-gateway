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
      console.log("[ERROR]", err);
      if (err.response && err.response.status) {
        return res.status(err.response.status).send(err.response.data);
      }

      return res.status(500).send();
    }
  };

  if (!route.auth) {
    route.upstreamMethods.forEach(method => {
      app[method](route.upstreamPath, routeProxy(method));
    });
  } else {
    route.upstreamMethods.forEach(method => {
      app[method](
        route.upstreamPath,
        authentication(config),
        authorization(route.scopes),
        routeProxy(method)
      );
    });
  }
};
