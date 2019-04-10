/**
 * Copyright (C) CODUCT GmbH - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 *
 * Proprietary and confidential
 * Written by Erek Röös <erek.roeoes@coduct.com>, 2019
 */

export type Configuration = {
  port: number;
  authentication: Authentication;
  routes: Route[];
  aggregates: Aggregate[];
};

export type Authentication = {
  host: string;
  port: number;
  path: string;
};

export type Route = {
  downstreamPath: string;
  downstreamHost: string;
  downstreamPort: number;
  downstreamSSL: boolean;
  downstreamUrlSuffix: string;
  upstreamPath: string;
  upstreamMethods: string[];
  key: string;
  scopes: string[];
  auth: boolean;
  ratelimit: boolean;
  findTime: number;
  maxRetry: number;
};

export type Aggregate = {
  upstreamPath: string;
  keys: string[];
  upstreamMethods: string[];
  auth: boolean;
};
