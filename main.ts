/**
 * Copyright (C) CODUCT GmbH - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 * Written by Erek Röös <erek.roeoes@coduct.com>, 2019
 */

require("dotenv").config();

import * as fs from "fs";
import * as express from "express";
import * as yaml from "yaml";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import { Configuration } from "./models/Configuration";

import createProxyRoute from "./helpers/create-proxy-route";
import createAggregateRoute from "./helpers/create-aggregate-route";

const app = express();

/**
 * Reads the configuration file provided in yaml format and builds
 * an API Gateway out of it
 */
const readConfiguration = (configurationFilePath: string): Configuration => {
  const configurationFile = fs.readFileSync(configurationFilePath, "utf-8");
  return yaml.parse(configurationFile);
};

/**
 * Application kickoff
 */
export const run = (configFilePath: string) => {
  try {
    const config = readConfiguration(configFilePath);

    // Installing global middleware
    app.use(cors());
    app.use(bodyParser.json({ limit: "50MB" }));

    // Building the reverse proxy facade
    if (config.routes) config.routes.forEach(route => createProxyRoute(app, config, route));
    if (config.aggregates)
      config.aggregates.forEach(aggregate => createAggregateRoute(app, config, aggregate));

    app.listen(config.port, () => console.log("[INFO]", "Gateway is listening"));
  } catch (err) {
    console.log("[ERROR]", err);
  }
};
