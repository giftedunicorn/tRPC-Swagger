import { Request, Response } from "express"

import { OpenApiRouter } from "../types"
import {
  CreateOpenApiNodeHttpHandlerOptions,
  createOpenApiNodeHttpHandler
} from "./node-http/core"

export type CreateOpenApiExpressMiddlewareOptions<TRouter extends OpenApiRouter> =
  // @ts-ignore - @trpc/server v11.x.x support revisit after cores are stable
  CreateOpenApiNodeHttpHandlerOptions<TRouter, Request, Response>;

export const createOpenApiExpressMiddleware = <TRouter extends OpenApiRouter>(
  opts: CreateOpenApiExpressMiddlewareOptions<TRouter>
) => {
  const openApiHttpHandler = createOpenApiNodeHttpHandler(opts)

  return async (req: Request, res: Response) => {
    await openApiHttpHandler(req, res)
  }
}
