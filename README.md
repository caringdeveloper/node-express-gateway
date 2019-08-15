# Node.js express.js Gateway

> This is the node-express-gateway package which provides a small and easy API gateway. If you need more power and are looking for the express-gateway package click here: https://github.com/expressgateway/express-gateway

## Goals

* Everything should be controllable through a YAML configuration file.
* The Gateway could be used programmatically or as CLI program
* The developer should be able to use which API framework should be used (express.js, fastify, restify, ...)
* It should be possible to build aggregates of routes

## Philosophy

* Only TypeScript code
* Small dependency footprint
* Only use well known dependencies

## TODO

* ~~Move to object oriented programming style~~
  * ~~Use dependency injection pattern~~
  * ~~Use inverson of control container (like inversify.js)~~
* Provide as executable
* Allow multiple API frameworks (for now express is hard-coded)

## How to use

### Installation

```bash
$ npm i node-express-gateway
$ # or
$ yarn add node-express-gateway
```

### Usage
```js
import Gateway from "../index";

const gw1 = Gateway();
const gw2 = Gateway();

gw1.run("./__tests__/fixtures/config.yml");
gw2.run("./__tests__/fixtures/config_2.yml");
```

### Example configuration file
```yaml
port: 4000

authentication:
  host: localhost
  port: 3002
  path: /api/user/auth/

routes:
  - downstreamPath: /api/secret
    downstreamHost: your-host.com
    downstreamPort: 443
    downstreamSSL: true
    downstreamUrlSuffix: add-your-suffix-here-(is-added-to-url)
    upstreamPath: /api/
    upstreamMethods:
      - get
    auth: true
    scopes:
      - admin
      - registered
    
  - downstreamPath: /api/open
    downstreamHost: your-host.com
    downstreamPort: 443
    downstreamSSL: true
    downstreamUrlSuffix: add-your-suffix-here-(is-added-to-url)
    upstreamPath: /api/open
    upstreamMethods:
      - get
    auth: false
```
