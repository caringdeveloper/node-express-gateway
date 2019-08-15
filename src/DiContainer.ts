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

import * as express from "express";
import { Container, interfaces } from "inversify";
import ConfigurationProvider from "./ConfigurationProvider";
import IConfigurationProvider from "./IConfigurationProvider";
import { Application } from "express";
import Library from "../Library";
import IRouteGenerator from "./IRouteGenerator";
import RouteGenerator from "./RouteGenerator";
import IAuthenticator from "./middleware/IAuthenticator";
import JwtAuthenticator from "./middleware/JwtAuthenticator";
import IAuthorizer from "./middleware/IAuthorizer";
import ScopeAuthorizer from "./middleware/ScopeAuthorizer";
import IUserInformation from "./middleware/IUserInformation";
import UserInformation from "./middleware/UserInformation";

const diContainer = new Container();
// const app = express();

diContainer
  .bind<Library>("Library")
  .to(Library)
  // .inSingletonScope();

diContainer
  .bind<IConfigurationProvider>("ConfigurationProvider")
  .to(ConfigurationProvider)
  .inSingletonScope();

diContainer.bind<IAuthenticator>("Authenticator").to(JwtAuthenticator);
diContainer.bind<IAuthorizer>("Authorizer").to(ScopeAuthorizer);
diContainer.bind<IRouteGenerator>("RouteGenerator").to(RouteGenerator);
diContainer.bind<IUserInformation>("UserInformation").to(UserInformation);

// diContainer.bind<Application>("App").toConstantValue(app);
diContainer.bind<Application>("App").toDynamicValue((ctx: interfaces.Context) => express())

export default diContainer;
