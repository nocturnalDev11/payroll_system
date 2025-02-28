<script setup>
import { ref } from 'vue';
import Modal from '@/components/Modal.vue';

defineProps({
    leave: {
        type: Object,
        required: true
    }
});

const showLeaveRequestDetails = ref(false);

// Format date for display
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Get status class for styling
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

// Close modal
const closeLeaveRequestDetails = () => {
    showLeaveRequestDetails.value = false;
};
</script>

<template>
    <div>
        <button @click="showLeaveRequestDetails = true"
            class="bg-blue-50 text-blue-600 py-1.5 px-3 rounded-lg hover:bg-blue-100 transition-all duration-200">
            View Details
        </button>

        <Modal :show="showLeaveRequestDetails" @close="closeLeaveRequestDetails">
            <div class="p-6">
                <h2 class="text-xl font-bold mb-4">Leave Request Details</h2>
                <div class="space-y-2">
                    <p><strong>Employee:</strong> {{ leave.employeeName }}</p>
                    <p><strong>Employee ID:</strong> {{ typeof leave.employeeId === 'object' ? leave.employeeId._id :
                        leave.employeeId }}</p>
                    <p><strong>Start Date:</strong> {{ formatDate(leave.startDate) }}</p>
                    <p><strong>End Date:</strong> {{ formatDate(leave.endDate) }}</p>
                    <p><strong>Reason:</strong> {{ leave.reason }}</p>
                    <p><strong>Status:</strong> <span :class="getStatusClass(leave.status)">{{ leave.status }}</span>
                    </p>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                    <button @click="closeLeaveRequestDetails"
                        class="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200">
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    </div>
</template>