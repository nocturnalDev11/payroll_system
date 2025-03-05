<script setup>
import { ref, computed, onMounted } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';

// State
const newLeave = ref({
    startDate: '',
    endDate: '',
    reason: ''
});
const leaveRequests = ref([]);
const currentPage = ref(1);
const requestsPerPage = ref(5);
const isSubmitting = ref(false);
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
            useAuthStore().logout(); // Logout if token is expired
            return { employeeId: null, token: null };
        }
        return { employeeId: payload.employeeId, token };
    } catch (error) {
        console.error('Failed to parse token:', error);
        return { employeeId: null, token: null };
    }
};

// Fetch employee profile to get the name
const fetchEmployeeProfile = async (employeeId, token) => {
    if (!token) {
        throw new Error('No authentication token available');
    }

    try {
        const response = await fetch(`${BASE_API_URL}/api/employee/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to fetch employee profile: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        return `${data.firstName} ${data.lastName}`.trim();
    } catch (error) {
        console.error('Failed to fetch employee profile:', error);
        return 'Unknown';
    }
};

// Methods
const fetchLeaveRequests = async () => {
    const { employeeId, token } = getAuthData();

    if (!employeeId || !token) {
        statusMessage.value = 'Authentication required. Please log in again.';
        setTimeout(() => statusMessage.value = '', 3000);
        return;
    }

    try {
        console.log('Fetching leave requests for employee:', employeeId);
        const response = await fetch(`${BASE_API_URL}/api/leaves/employee/${employeeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        if (!response.ok) {
            const text = await response.text();
            console.error('Fetch response:', text);
            throw new Error('Failed to fetch leave requests');
        }
        leaveRequests.value = await response.json() || [];
    } catch (error) {
        console.error('Failed to fetch leave requests:', error);
        statusMessage.value = 'Failed to load leave requests. Please try again.';
        setTimeout(() => statusMessage.value = '', 3000);
    }
};

const submitLeaveRequest = async () => {
    isSubmitting.value = true;
    const { employeeId, token } = getAuthData();

    if (!employeeId || !token) {
        statusMessage.value = 'Authentication required. Please log in again.';
        isSubmitting.value = false;
        setTimeout(() => statusMessage.value = '', 3000);
        return;
    }

    try {
        const employeeName = await fetchEmployeeProfile(employeeId, token);
        if (employeeName === 'Unknown') {
            throw new Error('Failed to fetch employee profile');
        }

        const leaveData = {
            employeeId,
            employeeName,
            startDate: newLeave.value.startDate,
            endDate: newLeave.value.endDate,
            reason: newLeave.value.reason,
            status: 'Pending'
        };

        const response = await fetch(`${BASE_API_URL}/api/leaves`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(leaveData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${errorText}`);
        }

        const newRequest = await response.json();
        leaveRequests.value.unshift(newRequest);
        statusMessage.value = 'Request submitted successfully!';
        resetForm();
        currentPage.value = 1;
    } catch (error) {
        console.error('Failed to submit leave request:', error);
        statusMessage.value = error.message || 'Failed to submit leave request. Please try again.';
    } finally {
        isSubmitting.value = false;
        setTimeout(() => statusMessage.value = '', 3000);
    }
};

const resetForm = () => {
    newLeave.value = {
        startDate: '',
        endDate: '',
        reason: ''
    };
};

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
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Leave Request Form -->
                <div class="bg-white p-6 rounded-xl shadow-md">
                    <h2 class="text-2xl font-semibold mb-4">Request Leave</h2>

                    <form @submit.prevent="submitLeaveRequest">
                        <div class="mb-4">
                            <label class="block text-gray-700 font-medium mb-2">Start Date:</label>
                            <input type="date" v-model="newLeave.startDate"
                                class="w-full p-2 border rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-300 outline-none"
                                required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 font-medium mb-2">End Date:</label>
                            <input type="date" v-model="newLeave.endDate"
                                class="w-full p-2 border rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-300 outline-none"
                                required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 font-medium mb-2">Reason for Leave:</label>
                            <textarea v-model="newLeave.reason"
                                class="w-full p-2 border rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-300 outline-none min-h-[100px]"
                                required></textarea>
                        </div>
                        <button type="submit"
                            class="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium"
                            :disabled="isSubmitting">
                            {{ isSubmitting ? 'Submitting...' : 'Send Request' }}
                        </button>
                    </form>

                    <div v-if="statusMessage"
                        :class="statusMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                        class="mt-4 p-3 rounded-lg text-center">
                        {{ statusMessage }}
                    </div>
                </div>

                <!-- Leave Requests List with Pagination -->
                <div class="bg-white p-6 rounded-xl shadow-md">
                    <h2 class="text-2xl font-semibold mb-4">My Leave Requests</h2>

                    <div class="space-y-4">
                        <div v-for="request in paginatedRequests" :key="request._id"
                            class="border rounded-lg p-4 hover:shadow-sm transition-all">
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