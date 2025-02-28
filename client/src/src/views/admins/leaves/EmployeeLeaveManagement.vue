<!-- EmployeeLeaveManagement.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';
import LeaveRequestDetails from './Partials/LeaveRequestDetails.vue';

// State
const leaveRequests = ref([]);
const showDetailsModalVisible = ref(false);
const selectedLeave = ref({});

// Fetch all leave requests
const fetchLeaveRequests = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/leaves/all`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch leave requests');
        leaveRequests.value = await response.json() || [];
    } catch (error) {
        console.error('Failed to fetch leave requests:', error);
        alert('Failed to load leave requests. Please try again.');
    }
};

// Refresh leave requests
const refreshLeaveRequests = async () => {
    await fetchLeaveRequests();
    alert('Leave requests refreshed!');
};

// Approve leave request
const approveLeave = async (id) => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/leaves/${id}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to approve leave');
        const data = await response.json();
        if (data.success) {
            leaveRequests.value = leaveRequests.value.map(leave =>
                leave._id === id ? { ...leave, status: 'Approved' } : leave
            );
            alert('Leave approved successfully!');
        }
    } catch (error) {
        console.error('Failed to approve leave:', error);
        alert('Failed to approve leave. Please try again.');
    }
};

// Disapprove leave request
const disapproveLeave = async (id) => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/leaves/${id}/disapprove`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to disapprove leave');
        const data = await response.json();
        if (data.success) {
            leaveRequests.value = leaveRequests.value.map(leave =>
                leave._id === id ? { ...leave, status: 'Disapproved' } : leave
            );
            alert('Leave disapproved successfully!');
        }
    } catch (error) {
        console.error('Failed to disapprove leave:', error);
        alert('Failed to disapprove leave. Please try again.');
    }
};

// Show details modal
const showDetailsModal = (leave) => {
    selectedLeave.value = { ...leave };
    showDetailsModalVisible.value = true;
};

// Close details modal
const closeDetailsModal = () => {
    showDetailsModalVisible.value = false;
    selectedLeave.value = {};
};

// Format date for display (used in parent until passed to child)
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Get status class for styling (used in parent until passed to child)
const getStatusClass = (status) => {
    switch (status) {
        case 'Pending':
            return 'text-yellow-600';
        case 'Approved':
            return 'text-green-600';
        case 'Disapproved':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
};

// Lifecycle hook
onMounted(() => {
    fetchLeaveRequests();
});
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div class="max-w-6xl mx-auto">
            <div class="bg-white p-6 rounded-xl shadow-md">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-gray-900">Employee Leave Management</h2>
                    <button @click="refreshLeaveRequests"
                        class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200">
                        Refresh
                    </button>
                </div>

                <!-- Leave Requests Table -->
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee Name</th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Leave Start Date</th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Leave End Date</th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status</th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="leave in leaveRequests" :key="leave._id" class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ leave.employeeName }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                    formatDate(leave.startDate) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                    formatDate(leave.endDate) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold"
                                    :class="getStatusClass(leave.status)">
                                    {{ leave.status }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                    <LeaveRequestDetails :leave="leave" />
                                    <button v-if="leave.status === 'Pending'" @click="approveLeave(leave._id)"
                                        class="bg-green-50 text-green-600 py-1.5 px-3 rounded-lg hover:bg-green-100 transition-all duration-200">
                                        Approve
                                    </button>
                                    <button v-if="leave.status === 'Pending'" @click="disapproveLeave(leave._id)"
                                        class="bg-red-50 text-red-600 py-1.5 px-3 rounded-lg hover:bg-red-100 transition-all duration-200">
                                        Disapprove
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="leaveRequests.length === 0">
                                <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">No leave requests
                                    found.</td>
                            </tr>
                        </tbody>
                    </table>
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

.hover\:bg-gray-50:hover {
    background-color: #f9fafb;
}
</style>