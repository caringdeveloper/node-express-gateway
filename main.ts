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

    // Trust our nginx reverse proxy
    app.enable("trust proxy");

    // Installing global middleware
    app.use(cors());
    app.use(bodyParser.json({ limit: "50MB" }));

    // Building the reverse proxy facade
    if (config.routes) config.routes.forEach(route => createProxyRoute(app, config, route));
    if (config.aggregates)
      config.aggregates.forEach(aggregate => createAggregateRoute(app, config, aggregate));

    app.listen(config.port, () => console.log("[INFO]", "Gateway is listening"));
  } catch (err) {
    console.log("[ERROR] ", new Date().toISOString(), " :: ", err);
  }
};
