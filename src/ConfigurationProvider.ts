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

import * as fs from "fs";
import * as yaml from "yaml";
import { promisify } from "util";
import IConfigurationProvider from "./IConfigurationProvider";
import { Configuration } from "./models/Configuration";
import { injectable } from "inversify";

const readFileAsync = promisify(fs.readFile);

@injectable()
export default class ConfigurationProvider implements IConfigurationProvider {
  private parsedConfiguration: Configuration = undefined;

  public async readConfiguration(configurationFilePath: string): Promise<void> {
    if (!this.parsedConfiguration) {
      const configurationFileContent = (await readFileAsync(configurationFilePath)).toString(
        "utf8"
      );

      this.parsedConfiguration = yaml.parse(configurationFileContent) as Configuration;
    }
  }

  public getConfiguration(): Configuration {
    return this.parsedConfiguration;
  }
}
