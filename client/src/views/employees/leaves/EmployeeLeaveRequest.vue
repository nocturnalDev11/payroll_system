<script setup>
import { ref, computed, onMounted } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store';
import RequestLeave from './partials/RequestLeave.vue';

// State
const showRequestLeave = ref(false);
const leaveRequests = ref([]);
const currentPage = ref(1);
const requestsPerPage = ref(5);
const statusMessage = ref('');

// Computed properties
const totalPages = computed(() => {
    return Math.ceil(leaveRequests.value.length / requestsPerPage.value);
});

const paginatedRequests = computed(() => {
    const start = (currentPage.value - 1) * requestsPerPage.value;
    const end = start + requestsPerPage.value;
    return leaveRequests.value.slice(start, end);
});

// Helper to get employeeId and token from localStorage
const getAuthData = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found in localStorage');
        return { employeeId: null, token: null };
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            console.error('Token has expired');
            useAuthStore().logout();
            return { employeeId: null, token: null };
        }
        return { employeeId: payload.employeeId, token };
    } catch (error) {
        console.error('Failed to parse token:', error);
        return { employeeId: null, token: null };
    }
};

// Fetch leave requests
const fetchLeaveRequests = async () => {
    const { employeeId, token } = getAuthData();

    if (!employeeId || !token) {
        statusMessage.value = 'Authentication required. Please log in again.';
        setTimeout(() => statusMessage.value = '', 3000);
        return;
    }

    try {
        const response = await fetch(`${BASE_API_URL}/api/leaves/employee/${employeeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to fetch leave requests: ${text}`);
        }
        leaveRequests.value = await response.json() || [];
    } catch (error) {
        console.error('Failed to fetch leave requests:', error);
        statusMessage.value = 'Failed to load leave requests. Please try again.';
        setTimeout(() => statusMessage.value = '', 3000);
    }
};

// Handle new leave request submission
const handleLeaveRequestSubmitted = (newRequest) => {
    leaveRequests.value.unshift(newRequest);
    currentPage.value = 1; // Reset to first page to show new request
};

// Pagination methods
const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }
};

const previousPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Lifecycle hook
onMounted(() => {
    fetchLeaveRequests();
});
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div class="max-w-6xl mx-auto">
            <div class="py-4">
                <RequestLeave :show="showRequestLeave" @open="showRequestLeave = true" @close="showRequestLeave = false"
                    @submit="handleLeaveRequestSubmitted" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Leave Requests List with Pagination -->
                <div class="bg-white p-6 rounded-xl shadow-md">
                    <h2 class="text-2xl font-semibold mb-4">My Leave Requests</h2>

                    <div class="space-y-4">
                        <div v-for="request in paginatedRequests" :key="request._id"
                            class="border border-gray-300 rounded-lg p-4 hover:shadow-sm transition-all">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="font-medium">{{ request.employeeName }}</h3>
                                    <p class="text-sm text-gray-600">
                                        {{ formatDate(request.startDate) }} to {{ formatDate(request.endDate) }}
                                    </p>
                                    <p class="mt-2 text-gray-700">{{ request.reason }}</p>
                                </div>
                                <span :class="{
                                    'bg-yellow-100 text-yellow-700': request.status === 'Pending',
                                    'bg-green-100 text-green-700': request.status === 'Approved',
                                    'bg-red-100 text-red-700': request.status === 'Disapproved'
                                }" class="px-3 py-1 rounded-full text-sm font-medium">
                                    {{ request.status }}
                                </span>
                            </div>
                        </div>

                        <div v-if="leaveRequests.length === 0" class="text-center text-gray-500 py-8">
                            No leave requests yet
                        </div>

                        <!-- Pagination Controls -->
                        <div v-if="leaveRequests.length > 0" class="mt-6 flex justify-between items-center">
                            <button @click="previousPage" :disabled="currentPage === 1"
                                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                                Previous
                            </button>
                            <span class="text-gray-600">
                                Page {{ currentPage }} of {{ totalPages }}
                            </span>
                            <button @click="nextPage" :disabled="currentPage === totalPages"
                                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.transition-all {
    transition: all 0.2s ease-in-out;
}
</style>