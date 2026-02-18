import { Outlet, RouterProvider, createRootRouteWithContext, createRoute, createRouter, redirect } from "@tanstack/react-router";

import type { AuthSession } from "./auth/session.js";
import { AppShellPage } from "./routes/app-shell.js";
import { LoginPage } from "./routes/login.js";

type RouterContext = {
  auth: {
    session: AuthSession | null;
  };
};

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />
});

export const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  beforeLoad: ({ context, location }) => {
    if (!context.auth.session?.user?.id) {
      const searchString = typeof location.searchStr === "string" ? location.searchStr : "";

      throw redirect({
        to: "/login",
        search: {
          redirectTo: `${location.pathname}${searchString}`
        }
      });
    }
  },
  component: () => <Outlet />
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: ({ context }) => {
    if (context.auth.session?.user?.id) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage
});

export const appShellRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/",
  component: AppShellPage
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([appShellRoute])
]);

export const router = createRouter({
  routeTree,
  context: {
    auth: {
      session: null
    }
  },
  defaultPreload: "intent"
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouterProvider(props: { session: AuthSession | null }) {
  return <RouterProvider router={router} context={{ auth: { session: props.session } }} />;
}
