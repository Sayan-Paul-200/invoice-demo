import { Navigate } from "react-router-dom";
import { AppRoute } from "./utils";
import { lazy, Suspense } from "react";
import { SuspenseLoader } from "@components/loaders/SuspenseLoader";

// Import pages
const Register = lazy(() => import('@pages/default/Register'));
const Login = lazy(() => import('@pages/default/Login'));
const Logout = lazy(() => import('@pages/default/Logout'));
// const AccountPicker = lazy(() => import('@pages/default/AccountPicker'));
const NotFoundPage = lazy(() => import('@pages/default/NotFoundPage'));


export const defaultRoutes: AppRoute[] = [
    {
        path: '/',
        element: <Navigate to='/login' />,
    },
    {
        path: '/register',
        element: (
            <Suspense fallback={<SuspenseLoader />}>
                <Register />
            </Suspense>
        )
    },
    {
        path: '/login',
        element: (
            <Suspense fallback={<SuspenseLoader />}>
                <Login />
            </Suspense>
        )
    },
    {
        path: '/logout',
        element: (
            <Suspense fallback={<SuspenseLoader />}>
                <Logout />
            </Suspense>
        )
    }, 
    // {
    //     path: '/account-picker',
    //     element: (
    //         <Suspense fallback={<SuspenseLoader />}>
    //             <AccountPicker />
    //         </Suspense>
    //     )
    // },
    {
        path: '*',
        element: (
            <Suspense fallback={<SuspenseLoader />}>
                <NotFoundPage />
            </Suspense>
        )
    },
]