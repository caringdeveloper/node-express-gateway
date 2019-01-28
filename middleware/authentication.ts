/**
 * Copyright (C) CODUCT GmbH - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 * Written by Erek Röös <erek.roeoes@coduct.com>, 2019
 */

import * as jwt from "jsonwebtoken";
import * as axios from "axios";
import * as express from "express";
import { Configuration } from "../models/Configuration";

const { JWT_SECRET } = process.env;

export default (config: Configuration) => async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.log("[MIDDLEWARE]", "Authenticate the user");

  // For now the authentication middleware will only support Bearer JWT Token authentication
  const authenticationString = req.headers.authorization;
  if (!authenticationString) return res.status(400).json({ reason: "No authentication header found" });

  const token = authenticationString.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(400).json({ reason: "Token is malformed" });
  }

  // Token is not valid
  if (!decodedToken) return res.status(400).json({ reason: "Not a valid token" });

  console.log("[DEBUG]", "Decoded token", decodedToken);

  try {
    const { data } = await axios.default.get(
      "https://" +
        config.authentication.host +
        ":" +
        config.authentication.port +
        "/" +
        config.authentication.path +
        "/" +
        token
    );

    req["user"] = {
      id: data.userId,
      scopes: decodedToken.scopes
    };

    return next();
  } catch (err) {
    console.log("[DEBUG]", "Token seems not be valid");
    return res.status(400).json({ reason: "Token seems not be valid" });
  }
};
