import type { RouteRecordRaw } from 'vue-router';

const employeeRoutes: Array<RouteRecordRaw> = [
    {
        path: '/employee/login',
        name: 'employee-login',
        component: () => import('../views/employees/auth/EmployeeLogin.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/employee/signup',
        name: 'employee-signup',
        component: () => import('../views/employees/auth/EmployeeSignup.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/employee',
        component: () => import('../layouts/EmployeeLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: 'dashboard',
                name: 'employee-dashboard',
                component: () => import('../views/employees/EmployeeDashboard.vue'),
            },
            {
                path: 'attendance',
                name: 'employee-attendance',
                component: () => import('../views/employees/attendance/EmployeeAttendance.vue'),
            },
            {
                path: 'leave/request',
                name: 'employee-leave-request',
                component: () => import('../views/employees/leaves/EmployeeLeaveRequest.vue'),
            },
            {
                path: 'salary-slips',
                name: 'salary-slips',
                component: () => import('../views/employees/EmployeeSalarySlip.vue'),
            },
            {
                path: 'holidays',
                name: 'list-of-holidays',
                component: () => import('../views/ListOfHolidays.vue'),
            }
        ],
    }
];

export default employeeRoutes;
