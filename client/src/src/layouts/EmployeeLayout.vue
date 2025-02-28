<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store.ts';
import IconLeave from '../components/icons/IconLeave.vue';
import IconSalary from '../components/icons/IconSalary.vue';
import IconHoliday from '../components/icons/IconHoliday.vue';
import IconCalendar from '../components/icons/IconCalendar.vue';
import IconDashboard from '../components/icons/IconDashboard.vue';

const router = useRouter();
const authStore = useAuthStore();
const employee = computed(() => authStore.employee);

const logout = () => {
    authStore.logout();
    router.push('/employee/login');
};

const iconMap = {
    dashboard: IconDashboard,
    attendance: IconCalendar,
    salary: IconSalary,
    leave: IconLeave,
    holidays: IconHoliday
};

const menuItems = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: 'dashboard' },
    // { name: 'Attendance', path: '/employee/attendance', icon: 'attendance' },
    { name: 'Salary Slips', path: '/employee/salary-slips', icon: 'salary' },
    { name: 'Leave Management', path: '/employee/leave/request', icon: 'leave' },
    { name: 'Holidays', path: '/employee/holidays', icon: 'holidays' },
];
</script>

<template>
    <div class="flex flex-col h-screen bg-gray-50">
        <!-- Modern Header with gradient and glass effect -->
        <header
            class="flex justify-between items-center p-4 bg-gradient-to-r from-teal-600 to-lime-500 text-white backdrop-blur-sm shadow-lg">
            <div class="text-2xl font-bold tracking-tight">Payslip</div>
            <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                    <span class="h-8 w-8 bg-white rounded-full flex items-center justify-center text-teal-600">
                        {{ employee?.username?.[0]?.toUpperCase() }}
                    </span>
                    <span class="font-medium">{{ employee?.username }}</span>
                </div>
                <button @click="logout"
                    class="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm">
                    Logout
                </button>
            </div>
        </header>

        <div class="flex flex-1 overflow-hidden">
            <aside class="w-72 bg-white shadow-sm border-r border-gray-100">
                <nav class="p-4">
                    <ul class="space-y-2">
                        <li v-for="(item, index) in menuItems" :key="index">
                            <router-link :to="item.path"
                                class="flex items-center p-3 rounded-xl transition-all duration-200 hover:bg-teal-50 hover:text-teal-600"
                                active-class="bg-teal-50 text-teal-600 font-medium shadow-sm">
                                <component v-if="iconMap[item.icon]" :is="iconMap[item.icon]"
                                    class="mr-5 w-5 h-5 text-cyan-600" />
                                <i v-else :class="item.icon" class="text-cyan-600"></i>

                                <span>{{ item.name }}</span>
                            </router-link>
                        </li>
                    </ul>
                </nav>
            </aside>

            <!-- Modern Main Content Area -->
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

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
