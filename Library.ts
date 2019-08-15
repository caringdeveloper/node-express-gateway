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

import * as cors from "cors";
import * as bodyParser from "body-parser";
import { injectable, inject } from "inversify";
import { Application } from "express";

import IConfigurationProvider from "./src/IConfigurationProvider";
import IRouteGenerator from "./src/IRouteGenerator";

@injectable()
export default class Library {
  @inject("App")
  private app: Application;

  @inject("ConfigurationProvider")
  private configurationProvider: IConfigurationProvider;

  @inject("RouteGenerator")
  private routeGenerator: IRouteGenerator;

  public async run(configFilePath: string): Promise<void> {
    await this.configurationProvider.readConfiguration(configFilePath);
    const config = this.configurationProvider.getConfiguration();

    this.app.enable("trust proxy");
    this.app.use(cors());
    this.app.use(bodyParser.json({ limit: "50MB" }));

    this.routeGenerator.injectAppInstance(this.app);
    if (config.routes) {
      config.routes.forEach(route => this.routeGenerator.createProxyRoute(route));
    }

    this.app.listen(config.port, () => console.log("[INFO]", "Gateway is listening"));
  }
}
