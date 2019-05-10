/**
 * Copyright (C) CODUCT GmbH - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 * Written by Erek Röös <erek.roeoes@coduct.com>, 2019
 */

import axios from "axios";
import * as jwt from "jsonwebtoken";
import * as express from "express";
import { Configuration } from "../models/Configuration";
import * as pathToRegexp from "path-to-regexp";

const { JWT_SECRET_KEY } = process.env;

export const authentication = (config: Configuration) => async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.log("[MIDDLEWARE]", "Authenticate the user");

  // For now the authentication middleware will only support Bearer JWT Token authentication
  const authenticationString = req.headers.authorization;
  if (!authenticationString)
    return res.status(400).json({ reason: "No authentication header found" });

  const token = authenticationString.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, JWT_SECRET_KEY);
  } catch (err) {
    return res.status(400).json({ reason: "Token is malformed" });
  }

  // Token is not valid
  if (!decodedToken) return res.status(400).json({ reason: "Not a valid token" });

  console.log("[DEBUG]", "Decoded token", decodedToken);

  // Check if app override
  if (decodedToken.scope === "app") {
    req["user"] = {
      id: decodedToken.id,
      scopes: decodedToken.scope,
      token
    };

    return next();
  }

  // Check if token is still valid
  try {
    const toPath = pathToRegexp.compile(config.authentication.path);
    const compiledPath = toPath({
      userId: decodedToken.id,
      token
    });

    console.log("[DEBUG]", "Compiled path", compiledPath);

    await axios.get(
      `http://${config.authentication.host}:${config.authentication.port}${compiledPath}`
    );

    req["user"] = {
      id: decodedToken.id,
      scopes: decodedToken.scope,
      token
    };

    return next();
  } catch (err) {
    if (err.response && err.response.status) {
      if (err.response.status === 403) {
        console.log("[DEBUG]", "User is banned");
        return res.status(403).json({ reason: "The account is banned" });
      }
    } else {
      console.log("[DEBUG]", "Token seems not to be valid");
      return res.status(400).json({ reason: "Token seems not to be valid" });
    }
  }
};
