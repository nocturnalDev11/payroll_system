<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store.ts';

const router = useRouter();
const authStore = useAuthStore();

const logout = () => {
    authStore.logout();
    router.push('/admin/login');
};

const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Employee Attendance', path: '/admin/employee/attendance', icon: 'fas fa-home' },
    { name: 'Manage Employees', path: '/admin/employee/manage', icon: 'fas fa-clock' },
    { name: 'Salary Slips', path: '/admin/employee/salary-slips', icon: 'fas fa-file-invoice-dollar' },
    { name: 'Manage Pay Heads', path: '/admin/employee/manage-pay-heads', icon: 'fas fa-calendar-alt' },
    { name: 'Employee Leave Management', path: '/admin/employee/leave-management', icon: 'fas fa-umbrella-beach' },
    { name: 'Holiday Selection', path: '/admin/holiday-selection', icon: 'fas fa-umbrella-beach' },
];
</script>

<template>
    <div class="flex flex-col h-screen bg-cyan-50">
        <!-- Modern Header with gradient and glass effect -->
        <header
            class="flex justify-between items-center p-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white backdrop-blur-sm shadow-lg">
            <div class="text-2xl font-bold tracking-tight">Payslip</div>
            <div class="flex items-center space-x-6">
                <!-- User Profile -->
                <div class="flex items-center">
                    <div
                        class="h-10 w-10 rounded-full bg-teal-700 flex items-center justify-center text-white text-lg font-medium shadow-sm">
                        A
                    </div>
                    <span class="ml-3 font-medium text-gray-50">Admin Panel</span>
                </div>

                <!-- Logout Button -->
                <button @click="logout" class="flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200
                         bg-white border border-gray-200 hover:bg-lime-50 text-gray-700 font-medium
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50
                         shadow-sm hover:shadow">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-500" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </header>

        <div class="flex flex-1">
            <!-- Modern Sidebar -->
            <aside class="w-72 bg-white shadow-sm border-r border-gray-100">
                <nav class="p-4">
                    <ul class="space-y-1">
                        <li v-for="(link, index) in menuItems" :key="index">
                            <router-link :to="link.path" class="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-lime-50 
                                             hover:text-cyan-600 transition-all duration-200"
                                active-class="bg-lime-50 text-cyan-600 font-medium">
                                <span>{{ link.name }}</span>
                            </router-link>
                        </li>
                    </ul>
                </nav>
            </aside>

            <!-- Main Content Area -->
            <main class="flex-1 p-6 overflow-y-auto">
                <div class="max-w-7xl mx-auto">
                    <router-view v-slot="{ Component }">
                        <transition name="fade" mode="out-in">
                            <component :is="Component" />
                        </transition>
                    </router-view>
                </div>
            </main>
        </div>
    </div>
</template>