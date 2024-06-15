![trpc-swagger](assets/trpc-swagger-readme.png)

<div align="center">
  <h1>trpc-swagger</h1>
  <a href="https://www.npmjs.com/package/trpc-swagger"><img src="https://img.shields.io/npm/v/trpc-swagger.svg?style=flat&color=brightgreen" target="_blank" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-black" /></a>
  <a href="https://trpc.io/discord" target="_blank"><img src="https://img.shields.io/badge/chat-discord-blue.svg" /></a>
  <br />
  <hr />
</div>


## **[Swagger](https://swagger.io/specification/) intigration for [tRPC](https://trpc.io/)** 

- Easy REST endpoints for your tRPC procedures.
- Perfect for incremental adoption.
- OpenAPI version 3.0.3.

## Fork Notice
The original repo [trpc-openapi](https://github.com/James/trpc-openapi) no longer appears to be maintained. 
The goal of this fork is to add more control for error responses, support more frameworks, and support the new procedure types in @trpc v11.x.x.
PRs Are welcome

This forked repo fixed the compatible issue with trpc 11, where you will see the error of "unknown procedure type". Hope this can help more people.

## Local Examples
If you've pulled the repo. you can run any of the example projects by first running these 2 commands:
```
yarn install
```
```
yarn build
```
Then select a workspace
```bash
yarn workspace with-[WORKSPACE_NAME] run dev
```
Ergo
```yaml
yarn workspace with-nextjs-app run dev
```

## Usage

**1. Install `trpc-swagger`**

```bash
npm install @alex8628/trpc-swagger --save
```
```bash
yarn add @alex8628/trpc-swagger
```
```bash
pnpm add @alex8628/trpc-swagger
```
```bash
bun add @alex8628/trpc-swagger
```

**2. Add `OpenApiMeta` to your tRPC instance**

```typescript
// @/server/trpc.ts
import { initTRPC } from '@trpc/server'
import { OpenApiMeta } from 'trpc-swagger'

// VERC: This
const t = initTRPC.create()

// VERC: Becomes
const t = initTRPC.meta<OpenApiMeta>().create()

// VERC: Advanced create configs
const t = initTRPC.meta<OpenApiMeta>().create({ ... })
```

**3. Enable `openapi` support for a procedure.**


```typescript
// @/server/index.ts
export const appRouter = t.router({
  sayHello: t.procedure
    .meta({ 
      openapi: { method: 'GET', path: '/say-hello' } 
    })
    .input(z.object({ 
      name: z.string() 
    }))
    .output(z.object({ 
      greeting: z.string() 
    }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.name}!` }
    })
})
```

**4. Generate an OpenAPI document.**

```typescript
// @/server/swagger.ts
import { generateOpenApiDocument } from 'trpc-swagger'
import { appRouter } from './appRouter'

/* 👇 */
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'tRPC Swagger',
  version: '1.0.0', // consider making this pull version from package.json
  baseUrl: 'http://localhost:3000', // consider making this dynamic
  docsUrl: "https://github.com/vercjames/trpc-swagger",
  tags: ["tag1", "tag2", "tag3", "posts"],
})
```

**5. Add an `trpc-swagger` handler to your app.**

We currently support adapters for [`Express`](http://expressjs.com/), [`Next.js`](https://nextjs.org/),  [`Next.js 14`](https://nextjs.org/), [`Serverless`](https://www.serverless.com/), [`Fastify`](https://www.fastify.io/), [`Nuxt`](https://nuxtjs.org/) & [`Node:HTTP`](https://nodejs.org/api/http.html).

```typescript
import http from 'http'
import { createOpenApiHttpHandler } from 'trpc-swagger'

import { appRouter } from '../appRouter'

const server = http.createServer(createOpenApiHttpHandler({ router: appRouter })) /* 👈 */

server.listen(3000)
```

**6. Profit 🤑**

```typescript
// client.ts
const res = await fetch('http://localhost:3000/say-hello?name=Verc', { method: 'GET' })
const body = await res.json() /* { greeting: 'Hello Verc!' } */
```

## Requirements

**Peer dependencies**

Your application requires these 2 packages installed
- [`tRPC`](https://github.com/trpc/trpc) Server v11 (`@trpc/server`) must be installed.
- [`Zod`](https://github.com/colinhacks/zod) v3 (`zod@^3.14.4`) must be installed (recommended `^3.20.0`).


**Procedure support**

For a procedure to support OpenAPI the following _must_ be true:

- Both `input` and `output` parsers are present AND use `Zod` validation.
- Query `input` parsers extend `Object<{ [string]: String | Number | BigInt | Date }>` or `Void`.
- Mutation `input` parsers extend `Object<{ [string]: AnyType }>` or `Void`.
- `meta.openapi.method` is `GET`, `POST`, `PATCH`, `PUT` or `DELETE`.
- `meta.openapi.path` is a string starting with `/`.
- `meta.openapi.path` parameters exist in `input` parser as `String | Number | BigInt | Date`

Please note:

- Data [`transformers`](https://trpc.io/docs/data-transformers) (such as `superjson`) are ignored.
- Trailing slashes are ignored.
- Routing is case-insensitive.

## HTTP Requests

Procedures with a `GET`/`DELETE` method will accept inputs via URL `query parameters`. Procedures with a `POST`/`PATCH`/`PUT` method will accept inputs via the `request body` with a `application/json` or `application/x-www-form-urlencoded` content type.

### Path parameters

A procedure can accept a set of inputs via URL path parameters. You can add a path parameter to any OpenAPI procedure by using curly brackets around an input name as a path segment in the `meta.openapi.path` field.

### Query parameters

Query & path parameter inputs are always accepted as a `string`. This library will attempt to [coerce](https://github.com/colinhacks/zod#coercion-for-primitives) your input values to the following primitive types out of the box: `number`, `boolean`, `bigint` and `date`. If you wish to support others such as `object`, `array` etc. please use [`z.preprocess()`](https://github.com/colinhacks/zod#preprocess).

```typescript
// Router
export const appRouter = t.router({
  sayHello: t.procedure
    .meta({ openapi: { method: 'GET', path: '/say-hello/{name}' /* 👈 */ } })
    .input(z.object({ name: z.string() /* 👈 */, greeting: z.string() }))
    .output(z.object({ greeting: z.string() }))
    .query(({ input }) => {
      return { greeting: `${input.greeting} ${input.name}!` }
    })
})

// Client
const res = await fetch('http://localhost:3000/say-hello/Verc?greeting=Hello' /* 👈 */, {
  method: 'GET',
})
const body = await res.json() /* { greeting: 'Hello Verc!' } */
```

### Request body

```typescript
// Router
export const appRouter = t.router({
  sayHello: t.procedure
    .meta({ openapi: { method: 'POST', path: '/say-hello/{name}' /* 👈 */ } })
    .input(z.object({ name: z.string() /* 👈 */, greeting: z.string() }))
    .output(z.object({ greeting: z.string() }))
    .mutation(({ input }) => {
      return { greeting: `${input.greeting} ${input.name}!` }
    })
})

// Client
const res = await fetch('http://localhost:3000/say-hello/Verc' /* 👈 */, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ greeting: 'Hello' }),
})
const body = await res.json() /* { greeting: 'Hello Verc!' } */
```

### Custom headers

Any custom headers can be specified in the `meta.openapi.headers` array, these headers will not be validated on request. Please consider using [Authorization](#authorization) for first-class OpenAPI auth/security support.

## HTTP Responses

Status codes will be `200` by default for any successful requests. In the case of an error, the status code will be derived from the thrown `TRPCError` or fallback to `500`.

You can modify the status code or headers for any response using the `responseMeta` function. Extra responses can be documented in the `meta.openapi.extraResponses` field.

```typescript
// Router
export const appRouter = t.router({
  sayHello: t.procedure
    .meta({ openapi: {
      method: 'POST',
      path: '/say-hello/{name}',
      extraResponses: {
          400: {
            description: 'Bad request',
            content: z.object({ reason: z.string().describe("The reason") }),
          },
      }
    }})
    .input(z.object({ name: z.string(), greeting: z.string() }))
    .output(z.object({ greeting: z.string() }))
    .mutation(({ input }) => {
      return { greeting: `${input.greeting} ${input.name}!` }
    })
})

```

Please see [error status codes here](packages/adapters/node-http/errors.ts).

## Authorization

To create protected endpoints, add `protect: true` to the `meta.openapi` object of each tRPC procedure. By default, you can then authenticate each request with the `createContext` function using the `Authorization` header with the `Bearer` scheme. If you wish to authenticate requests using a different/additional methods (such as custom headers, or cookies) this can be overwritten by specifying `securitySchemes` object.

Explore a [complete example here](examples/with-nextjs/src/server/router.ts).

#### Server

```typescript
import { TRPCError, initTRPC } from '@trpc/server'
import { OpenApiMeta } from 'trpc-swagger'

type User = { id: string, name: string }

const users: User[] = [
  {
    id: 'usr_123',
    name: 'Verc',
  },
]

export type Context = { user: User | null }

export const createContext = async ({ req, res }): Promise<Context> => {
  let user: User | null = null
  if (req.headers.authorization) {
    const userId = req.headers.authorization.split(' ')[1]
    user = users.find((_user) => _user.id === userId)
  }
  return { user }
}

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create()

export const appRouter = t.router({
  sayHello: t.procedure
    .meta({ openapi: { method: 'GET', path: '/say-hello', protect: true /* 👈 */ } })
    .input(z.void()) // no input expected
    .output(z.object({ greeting: z.string() }))
    .query(({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ message: 'User not found', code: 'UNAUTHORIZED' })
      }
      return { greeting: `Hello ${ctx.user.name}!` }
    }),
})
```

#### Client

```typescript
const res = await fetch('http://localhost:3000/say-hello', {
  method: 'GET',
  headers: { Authorization: 'Bearer usr_123' } /* 👈 */,
})
const body = await res.json() /* { greeting: 'Hello Verc!' } */
```

## Examples

_For advanced use-cases, please find examples in our [complete test suite](test)._

#### With Express

Please see [full example here](examples/with-express).

```typescript
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import express from 'express'
import { createOpenApiExpressMiddleware } from 'trpc-swagger'

import { appRouter } from '../appRouter'

const app = express()

app.use('/api/trpc', createExpressMiddleware({ router: appRouter }))
app.use('/api', createOpenApiExpressMiddleware({ router: appRouter })) /* 👈 */

app.listen(3000)
```

#### With Next.js

Please see [full example here](examples/with-nextjs).

```typescript
// pages/api/[...trpc].ts
import { createOpenApiNextHandler } from 'trpc-swagger'

import { appRouter } from '../../server/appRouter'

export default createOpenApiNextHandler({ router: appRouter })
```

#### With AWS Lambda

Please see [full example here](examples/with-serverless).

```typescript
import { createOpenApiAwsLambdaHandler } from 'trpc-swagger'

import { appRouter } from './appRouter'

export const openApi = createOpenApiAwsLambdaHandler({ router: appRouter })
```

#### With Fastify

Please see [full example here](examples/with-fastify).

```typescript
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify from 'fastify'
import { fastifyTRPCOpenApiPlugin } from 'trpc-swagger'

import { appRouter } from './router'

const fastify = Fastify()

async function main() {
  await fastify.register(fastifyTRPCPlugin, { router: appRouter })
  await fastify.register(fastifyTRPCOpenApiPlugin, { router: appRouter }) /* 👈 */

  await fastify.listen({ port: 3000 })
}

main()
```

## Types

#### GenerateOpenApiDocumentOptions

Please see [full typings here](packages/generator/index.ts).

| Property          | Type                                   | Description                                             | Required |
| ----------------- | -------------------------------------- | ------------------------------------------------------- | -------- |
| `title`           | `string`                               | The title of the API.                                   | `true`   |
| `description`     | `string`                               | A short description of the API.                         | `false`  |
| `version`         | `string`                               | The version of the OpenAPI document.                    | `true`   |
| `baseUrl`         | `string`                               | The base URL of the target server.                      | `true`   |
| `docsUrl`         | `string`                               | A URL to any external documentation.                    | `false`  |
| `tags`            | `string[]`                             | A list for ordering endpoint groups.                    | `false`  |
| `securitySchemes` | `Record<string, SecuritySchemeObject>` | Defaults to `Authorization` header with `Bearer` scheme | `false`  |

#### OpenApiMeta

Please see [full typings here](packages/types.ts).

| Property         | Type                               | Description                                                                                                        | Required | Default                |
| ---------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------- |
| `enabled`        | `boolean`                          | Exposes this procedure to `trpc-swagger` adapters and on the OpenAPI document.                                     | `false`  | `true`                 |
| `method`         | `HttpMethod`                       | HTTP method this endpoint is exposed on. Value can be `GET`, `POST`, `PATCH`, `PUT` or `DELETE`.                   | `true`   | `undefined`            |
| `path`           | `string`                           | Pathname this endpoint is exposed on. Value must start with `/`, specify path parameters using `{}`.               | `true`   | `undefined`            |
| `protect`        | `boolean`                          | Requires this endpoint to use a security scheme.                                                                   | `false`  | `false`                |
| `summary`        | `string`                           | A short summary of the endpoint included in the OpenAPI document.                                                  | `false`  | `undefined`            |
| `description`    | `string`                           | A verbose description of the endpoint included in the OpenAPI document.                                            | `false`  | `undefined`            |
| `tags`           | `string[]`                         | A list of tags used for logical grouping of endpoints in the OpenAPI document.                                     | `false`  | `undefined`            |
| `headers`        | `ParameterObject[]`                | An array of custom headers to add for this endpoint in the OpenAPI document.                                       | `false`  | `undefined`            |
| `contentTypes`   | `ContentType[]`                    | A set of content types specified as accepted in the OpenAPI document.                                              | `false`  | `['application/json']` |
| `extraResponses` | `ResponsesObject`* | An array of custom responses to add for this endpoint in the OpenAPI document in addition to the default response. | `false`  | `undefined`            |
| `deprecated`     | `boolean`                          | Whether or not to mark an endpoint as deprecated                                                                   | `false`  | `false`                |

* _The `content` field in ResponsesObject is expected to be a `z.ZodType`_

#### CreateOpenApiNodeHttpHandlerOptions

Please see [full typings here](packages/adapters/node-http/core.ts).

| Property        | Type       | Description                                            | Required |
| --------------- | ---------- | ------------------------------------------------------ | -------- |
| `router`        | `Router`   | Your application tRPC router.                          | `true`   |
| `createContext` | `Function` | Passes contextual (`ctx`) data to procedure resolvers. | `false`  |
| `responseMeta`  | `Function` | Returns any modifications to statusCode & headers.     | `false`  |
| `onError`       | `Function` | Called if error occurs inside handler.                 | `false`  |
| `maxBodySize`   | `number`   | Maximum request body size in bytes (default: 100kb).   | `false`  |

---

_Still using tRPC v9? See our [`.interop()`](examples/with-interop) example._

## License

Distributed under the MIT License. See LICENSE for more information.
