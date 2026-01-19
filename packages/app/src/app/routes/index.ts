import { createHashRouter } from "react-router-dom";
import { generateRouterConfig } from "./utils";

// Import routes
import { defaultRoutes } from "./routes.default";
import { adminRoutes } from "./routes.admin";

const routerConfig = generateRouterConfig([
    ...defaultRoutes,
    adminRoutes
])

export const appRouter = createHashRouter(routerConfig)