import { AppRoute } from "./utils";
import { lazy, Suspense } from "react";
import { SuspenseLoader } from "@components/loaders/SuspenseLoader";
import { AppLayout } from "@layouts/AppLayout";
import { 
  IconChartBar, 
  IconFileInvoice, 
  IconBriefcase, 
  IconDatabase, 
  IconUsers,
} from "@tabler/icons-react";

// Import pages
const AdminDashboard = lazy(() => import('@pages/admin/AdminDashboard'));
const Invoices = lazy(() => import('@pages/admin/Invoices'));

// Projects
const Projects = lazy(() => import('@pages/admin/Projects/Projects'));

// Commons (Master Data)
const States = lazy(() => import('@pages/admin/Commons/States'));
const ProjectModes = lazy(() => import('@pages/admin/Commons/ProjectModes'));
const BillCategories = lazy(() => import('@pages/admin/Commons/BillCategories'));
const Milestones = lazy(() => import('@pages/admin/Commons/Milestones'));
const Statuses = lazy(() => import('@pages/admin/Commons/Statuses'));
const GstPercentages = lazy(() => import('@pages/admin/Commons/GstPercentages'));

// Users
const Staffs = lazy(() => import('@pages/admin/Users/Staffs'));
const Accountants = lazy(() => import('@pages/admin/Users/Accountants'));

export const adminRoutes: AppRoute = {
    path: '/admin',
    element: <AppLayout />,
    children: [
        {
            label: 'Dashboard',
            path: 'dashboard',
            icon: IconChartBar,
            element: (
                <Suspense fallback={<SuspenseLoader />}>
                    <AdminDashboard />
                </Suspense>
            )
        },

        {
            label: 'Invoices',
            path: 'invoices',
            icon: IconFileInvoice,
            element: (
                <Suspense fallback={<SuspenseLoader />}>
                    <Invoices />
                </Suspense>
            )
        },

        {
            label: 'Projects',
            path: 'projects',
            icon: IconBriefcase,
            element: (
                <Suspense fallback={<SuspenseLoader />}>
                    <Projects />
                </Suspense>
            )
        },

        {
            label: 'Commons',
            icon: IconDatabase,
            path: 'commons', // This is a virtual grouping path
            children: [
                {
                    label: 'States',
                    path: 'states',
                    element: (
                        <Suspense fallback={<SuspenseLoader />}>
                            <States />
                        </Suspense>
                    )
                },
                {
                    label: 'Modes of Project',
                    path: 'mode-of-project',
                    element: (
                        <Suspense fallback={<SuspenseLoader />}>
                            <ProjectModes />
                        </Suspense>
                    )
                },
                {
                    label: 'Bill Categories',
                    path: 'bill-categories',
                    element: (
                        <Suspense fallback={<SuspenseLoader />}>
                            <BillCategories />
                        </Suspense>
                    )
                },
                {
                    label: 'Milestones',
                    path: 'milestones',
                    element: (
                        <Suspense fallback={<SuspenseLoader />}>
                            <Milestones />
                        </Suspense>
                    )
                },
                {
                    label: 'Status',
                    path: 'status',
                    element: (
                        <Suspense fallback={<SuspenseLoader />}>
                            <Statuses />
                        </Suspense>
                    )
                },
                {
                    label: 'GST Percentages',
                    path: 'gst-percentages',
                    element: (
                        <Suspense fallback={<SuspenseLoader />}>
                            <GstPercentages />
                        </Suspense>
                    )
                },
            ]
        },

        {
            label: 'Users',
            icon: IconUsers,
            path: 'users',
            children: [
                {
                    label: 'Staffs',
                    path: 'staffs',
                    element: (
                        <Suspense fallback={<SuspenseLoader />}>
                            <Staffs />
                        </Suspense>
                    )
                },
                {
                    label: 'Accountants',
                    path: 'accountants',
                    element: (
                        <Suspense fallback={<SuspenseLoader />}>
                            <Accountants />
                        </Suspense>
                    )
                },
            ]
        },
        
    ]
}