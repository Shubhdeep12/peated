import { CheckBadgeIcon, StarIcon } from "@heroicons/react/20/solid";
import { formatCategoryName } from "@peated/server/lib/format";
import Layout from "@peated/web/components/layout";
import { summarize } from "@peated/web/lib/markdown";
import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import BottleLink from "../components/bottleLink";
import Button from "../components/button";
import { makeIsomorphicLoader } from "../lib/isomorphicLoader";

export const { loader, clientLoader } = makeIsomorphicLoader(
  async ({ params: { flightId }, context: { trpc } }) => {
    invariant(flightId);

    return json({
      flight: await trpc.flightById.query(flightId),
      bottles: await trpc.bottleList.query({
        flight: flightId,
      }),
    });
  },
);

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];

  const description = summarize(data.flight.description || "", 200);

  return [
    {
      title: data.flight.name,
    },
    {
      name: "description",
      content: description,
    },
    {
      property: "og:title",
      content: data.flight.name,
    },
    {
      property: "og:description",
      content: description,
    },
    {
      property: "twitter:card",
      content: "product",
    },
  ];
};

export default function FlightDetails() {
  const { flight, bottles } = useLoaderData<typeof loader>();

  return (
    <Layout>
      <div className="my-4 flex min-w-full flex-wrap gap-x-3 gap-y-4 p-3 sm:flex-nowrap sm:py-0">
        <div className="w-full flex-auto flex-col items-center space-y-1 sm:w-auto sm:items-start">
          <h1 className="mb-2 truncate text-center text-3xl font-semibold leading-7 sm:text-left">
            {flight.name}
          </h1>
          {flight.description && (
            <div className="text-light truncate text-center sm:text-left">
              {flight.description}
            </div>
          )}
        </div>
      </div>
      <table className="min-w-full">
        <colgroup>
          <col className="min-w-full sm:w-5/6" />
          <col className="sm:w-1/6" />
        </colgroup>
        <tbody>
          {bottles.results.map((bottle) => {
            return (
              <tr key={bottle.id} className="border-b border-slate-800">
                <td className="group relative max-w-0 py-4 pl-4 pr-3 text-sm sm:pl-3">
                  <BottleLink
                    bottle={bottle}
                    flightId={flight.id}
                    className="absolute inset-0"
                  />
                  <div className="flex items-center gap-x-1 group-hover:underline">
                    <div className="font-semibold">{bottle.fullName}</div>
                    {bottle.isFavorite && (
                      <StarIcon className="h-4 w-4" aria-hidden="true" />
                    )}
                    {bottle.hasTasted && (
                      <CheckBadgeIcon className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className="text-light text-sm">
                    {formatCategoryName(bottle.category)}
                  </div>
                </td>
                <td className="py-4 pl-3 pr-4 text-right text-sm sm:table-cell sm:pr-3">
                  <Button
                    color={bottle.hasTasted ? "default" : "highlight"}
                    size="small"
                    to={`/bottles/${bottle.id}/addTasting?flight=${flight.id}`}
                  >
                    Record Tasting
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Layout>
  );
}
