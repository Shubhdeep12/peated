import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import Layout from "./components/layout";
import { Link } from "react-router-dom";
import config from "./config";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { ApiUnavailable } from "./lib/api";

export default function ErrorPage() {
  const error: any = useRouteError();

  const isOnline = useOnlineStatus();

  let subtitle: string = "Error";
  let title: string = "Sorry, an unexpected error has occurred.";
  if (error instanceof ApiUnavailable) {
    title = isOnline ? "Server Unreachable" : "Connection Offline";
    subtitle = isOnline
      ? "It looks like Peated's API is unreachable right now. Please try again shortly."
      : "It looks like your network is offline.";
  } else if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Not Found";
      subtitle = "We couldn't find the page you were looking for.";
    } else if (error.status === 404) {
      title = "Identify Yourself";
      subtitle =
        "To get to where you're going we need you to tell us who you are. We don't just let anyone in here.";
    }
  }

  console.error(error);

  return (
    <Layout gutter>
      <main className="inline self-center self-justify-center">
        <div className="text-center">
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 text-base leading-7 text-gray-600">{subtitle}</p>

          {config.DEBUG && (
            <>
              {error.remoteStack && (
                <div className="prose mx-auto mt-4">
                  <h3>Remote Stack</h3>
                  <pre className="text-left">{error.remoteStack}</pre>
                </div>
              )}
              {error.stack && (
                <div className="prose mx-auto mt-4">
                  <h3>Local Stack</h3>
                  <pre className="text-left">{error.stack}</pre>
                </div>
              )}
            </>
          )}
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/"
              className="rounded bg-peated px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-peated-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peated"
            >
              Go back home
            </Link>
            <a
              className="text-sm font-semibold text-gray-900"
              href={config.GITHUB_REPO}
            >
              Open a GitHub issue
            </a>
          </div>
        </div>
      </main>
    </Layout>
  );
}