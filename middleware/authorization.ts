/**
 * Copyright (C) CODUCT GmbH - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 * Written by Erek Röös <erek.roeoes@coduct.com>, 2019
 */

import * as express from "express";

export const authorization = (scopes: string[]) => (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.log("[MIDDLEWARE]", "Authorizing the user");

  console.log("[DEBUG]", "Given scopes", scopes);
  console.log("[DEBUG]", "Authenticated user", req["user"]);

  if (!scopes.includes(req["user"].scopes))
    return res.status(401).json({ reason: "Not authorized" });

  return next();
};
