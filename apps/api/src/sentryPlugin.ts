import * as Sentry from "@sentry/node-experimental";
import { isString, normalize } from "@sentry/utils";
import fastifyPlugin from "fastify-plugin";

export default fastifyPlugin(async (fastify, options) => {
  fastify.addHook("preHandler", async (request) => {
    Sentry.configureScope((scope) =>
      scope.addEventProcessor((event) => {
        try {
          event.transaction = `${request.method} ${request.routeOptions.url}`;
          event.transaction_info = {
            source: "url",
          };
          event.request = {
            method: request.method,
            url: `${request.protocol}://${request.hostname}${request.url}`,
            headers: request.headers as Record<string, string>, // idgaf
            query_string: request.query as Record<string, any>,
            data:
              request.body !== undefined
                ? isString(request.body)
                  ? request.body
                  : JSON.stringify(normalize(request.body))
                : undefined,
          };
        } catch (err) {
          console.error(err);
        }

        return event;
      }),
    );
  });

  fastify.addHook("onError", async (_request, _reply, error) => {
    Sentry.captureException(error);
  });
});
