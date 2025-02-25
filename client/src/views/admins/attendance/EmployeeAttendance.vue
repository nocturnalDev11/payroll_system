<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { BASE_API_URL } from '@/utils/constants.js';

// State
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const attendanceRecords = ref([]);
const statusMessage = ref(null);
const isLoading = ref(false);

// Computed
const filteredAttendance = computed(() => {
    return attendanceRecords.value.filter(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === selectedDate.value;
    });
});

// Enhanced time formatting function
const formatTime = (timeString) => {
    if (!timeString) return '--';
    const [hours, minutes] = timeString.split(':');
    const hourNum = parseInt(hours);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
};

// Methods
const fetchAttendance = async (event) => {
    event?.preventDefault(); // Prevent default form behavior if triggered by input
    isLoading.value = true;
    try {
        const response = await axios.get(`${BASE_API_URL}/api/attendance`);
        attendanceRecords.value = response.data.map(record => ({
            id: record._id,
            employeeIdNumber: record.employeeId.employeeIdNumber,
            name: `${record.employeeId.firstName} ${record.employeeId.lastName}`,
            position: record.employeeId.position,
            status: record.status,
            timeIn: record.timeIn,
            timeOut: record.timeOut,
            date: record.date
        }));
        showMessage('Attendance records loaded successfully', 'success');
    } catch (error) {
        console.error('Error fetching attendance:', error);
        showMessage(error.response?.data?.message || 'Failed to load attendance records', 'error');
    } finally {
        isLoading.value = false;
    }
};

const refreshData = (event) => {
    event.preventDefault(); // Prevent any default button behavior
    fetchAttendance();
};

const showMessage = (text, type) => {
    statusMessage.value = { text, type };
    setTimeout(() => {
        statusMessage.value = null;
    }, 3000);
};

// Lifecycle
onMounted(() => {
    fetchAttendance();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50 p-4">
        <!-- Calendar Selection -->
        <div class="bg-white p-4 rounded-lg shadow-md max-w-xs w-full mb-6">
            <label for="attendanceDate" class="block text-gray-700 font-medium text-sm mb-1">Select Date</label>
            <input type="date" v-model="selectedDate" id="attendanceDate"
                class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                @change="fetchAttendance">
        </div>

        <!-- Employees Information -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="p-3 border-b border-gray-200 flex justify-between items-center">
                <h2 class="text-lg font-semibold text-gray-700">Employees Information</h2>
                <button @click="refreshData"
                    class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm focus:outline-none">
                    Refresh
                </button>
            </div>
            <div class="overflow-x-auto">
                <!-- Added v-memo to prevent unnecessary re-renders -->
                <table class="min-w-full divide-y divide-gray-200" v-memo="[filteredAttendance]">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee ID #
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Position
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sign In Time
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sign Out Time
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="employee in filteredAttendance" :key="employee.id"
                            class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {{ employee.employeeIdNumber }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {{ employee.name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {{ employee.position }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {{ formatTime(employee.timeIn) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {{ formatTime(employee.timeOut) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span :class="{
                                    'text-green-600': employee.status === 'Present',
                                    'text-yellow-600': employee.status === 'Late',
                                    'text-red-600': employee.status === 'Absent'
                                }">
                                    {{ employee.status }}
                                </span>
                            </td>
                        </tr>
                        <!-- Use a separate row for no-records message to avoid layout shifts -->
                        <tr v-if="filteredAttendance.length === 0" key="no-records">
                            <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                                No attendance records for this date.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Status Message -->
        <div v-if="statusMessage" :class="{
            'bg-green-50 text-green-700': statusMessage.type === 'success',
            'bg-red-50 text-red-700': statusMessage.type === 'error'
        }" class="fixed bottom-4 right-4 p-4 rounded-lg shadow-md z-50">
            {{ statusMessage.text }}
        </div>

        <!-- Loading Overlay -->
        <div v-if="isLoading" class="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    </div>
</template>