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
        return res.status(403).json({ reason: "The account is banned" });
      }
    } else {
      return res.status(400).json({ reason: "Token seems not to be valid" });
    }
  }
};
