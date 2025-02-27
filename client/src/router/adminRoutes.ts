import type { RouteRecordRaw } from 'vue-router';

const adminRoutes: Array<RouteRecordRaw> = [
    {
        path: '/admin/login',
        name: 'admin-login',
        component: () => import('../views/admins/auth/AdminLogin.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/admin',
        component: () => import('../layouts/AdminLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: 'dashboard',
                name: 'admin-dashboard',
                component: () => import('../views/admins/AdminDashboard.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: 'employee/attendance',
                name: 'admin-employee-attendance',
                component: () => import('../views/admins/attendance/EmployeeAttendance.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: 'employee/manage',
                name: 'admin-employee-manage',
                component: () => import('../views/admins/employees/ManageEmployees.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: 'employee/salary-slips',
                name: 'admin-employee-salary-slips',
                component: () => import('../views/admins/payroll/SalarySlips.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: 'employee/manage-pay-heads',
                name: 'admin-employee-manage-pay-heads',
                component: () => import('../views/admins/payroll/ManagePayHeadsView.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: 'employee/leave-management',
                name: 'admin-employee-leave-management',
                component: () => import('../views/admins/leaves/EmployeeLeaveManagement.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: 'holiday-selection',
                name: 'admin-holiday-selection',
                component: () => import('../views/ListOfHolidays.vue'),
                meta: { requiresAuth: true }
            }
        ],
    }
];

export default adminRoutes;
