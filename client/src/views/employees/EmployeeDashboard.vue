<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { BASE_API_URL } from '../../utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.ts';

const authStore = useAuthStore();
const token = localStorage.getItem('token');
const employee = ref(null);
const attendanceRecords = ref([]);
const isTimedIn = ref(false);
const isLoading = ref(false);
const currentPayPeriod = ref('Feb 16 - Feb 28, 2025');

onMounted(async () => {
    if (!token) {
        console.error('No token found, redirecting to login...');
        return;
    }

    await getEmployeeProfile();

    if (authStore.employee && authStore.employee._id) {
        await fetchAttendanceRecords();
        await checkTimedInStatus();
    } else {
        console.error('Employee data not available after profile fetch');
    }
});

// Fetch employee profile
async function getEmployeeProfile() {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const employeeData = await response.json();
            console.log('Raw Employee Data:', employeeData);
            employee.value = employeeData;
            authStore.employee = { ...employeeData, _id: employeeData.id };
            console.log('Updated authStore.employee:', authStore.employee);
        } else {
            const errorText = await response.text();
            console.error('Failed to fetch profile:', response.status, response.statusText, errorText);
        }
    } catch (error) {
        console.error('Error fetching employee profile:', error.message);
    }
}

// Fetch attendance records
async function fetchAttendanceRecords() {
    try {
        const employeeId = authStore.employee?._id;
        if (!employeeId) {
            console.error('No employee ID available for fetching attendance');
            return;
        }

        const response = await fetch(`${BASE_API_URL}/api/attendance/${employeeId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            attendanceRecords.value = await response.json();
            console.log('Attendance records fetched:', attendanceRecords.value);
        } else if (response.status === 404) {
            // Silently handle 404 - no records exist yet
            attendanceRecords.value = [];
            console.log('No attendance records found for this employee yet');
        } else {
            const errorText = await response.text();
            console.error('Failed to fetch attendance records:', response.status, errorText);
        }
    } catch (error) {
        console.error('Error fetching attendance records:', error);
    }
}

// Check if the employee is already timed in for today
async function checkTimedInStatus() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = attendanceRecords.value.find(record => record.date === today);
    isTimedIn.value = todayRecord && todayRecord.timeIn && !todayRecord.timeOut;
    console.log('Timed in status:', isTimedIn.value);
}

// Time In function
async function timeIn() {
    isLoading.value = true;
    try {
        if (!authStore.employee || !authStore.employee._id) {
            console.error('No employee ID available for time in');
            alert('Please log in again to refresh your profile');
            return;
        }

        const payload = { employeeId: authStore.employee._id };
        console.log('Time In Request Payload:', payload);

        const response = await fetch(`${BASE_API_URL}/api/attendance/time-in`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        console.log('Time In Response:', response.status, responseData);

        if (response.ok) {
            attendanceRecords.value.push(responseData);
            isTimedIn.value = true;
        } else {
            alert(responseData.message || 'Failed to time in');
        }
    } catch (error) {
        console.error('Error during time in:', error);
        alert('An error occurred while timing in');
    } finally {
        isLoading.value = false;
    }
}

// Time Out function
async function timeOut() {
    isLoading.value = true;
    try {
        if (!authStore.employee || !authStore.employee._id) {
            console.error('No employee ID available for time out');
            alert('Please log in again to refresh your profile');
            return;
        }

        const payload = { employeeId: authStore.employee._id };
        console.log('Time Out Request Payload:', payload);

        const response = await fetch(`${BASE_API_URL}/api/attendance/time-out`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        console.log('Time Out Response:', response.status, responseData);

        if (response.ok) {
            const updatedRecord = responseData;
            const index = attendanceRecords.value.findIndex(record => record._id === updatedRecord._id);
            if (index !== -1) {
                attendanceRecords.value[index] = updatedRecord;
            }
            isTimedIn.value = false;
        } else {
            alert(responseData.message || 'Failed to time out');
        }
    } catch (error) {
        console.error('Error during time out:', error);
        alert('An error occurred while timing out');
    } finally {
        isLoading.value = false;
    }
}

const calculateNetSalary = (employee) => {
    if (!employee) return 0; // Return default if employee is null
    const salary = employee.salary || 0;
    const deductions = (employee.deductions?.sss || 0) +
        (employee.deductions?.philHealth || 0) +
        (employee.deductions?.pagIbig || 0);
    const earnings = (employee.earnings?.travelExpenses || 0) +
        (employee.earnings?.otherEarnings || 0);
    return salary - deductions + earnings;
};

// Computed property for employee initials
const employeeInitials = computed(() => {
    return employee.value?.firstName && employee.value?.lastName
        ? `${employee.value.firstName[0]}${employee.value.lastName[0]}`.toUpperCase()
        : '';
});

// Format Date for display
function formatDate(date) {
    if (!date) return '--';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
}

// Format time for display
function formatTime(time) {
    if (!time) return '--';
    const [hours, minutes] = time.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
}

// Status class for display
function getStatusClass(status) {
    return {
        'On Time': 'text-green-600',
        'Late': 'text-yellow-600',
        'Absent': 'text-red-600',
    }[status] || 'text-gray-600';
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div class="p-4">
            <!-- Employee Info Header -->
            <div class="mb-6 bg-white rounded-xl shadow-sm p-6" v-if="employee">
                <div class="flex items-center space-x-4">
                    <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-600 font-semibold text-lg">{{ employeeInitials }}</span>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800">{{ `${employee.firstName} ${employee.lastName}` }}
                        </h1>
                        <p class="text-sm text-gray-500">ID: {{ employee.employeeIdNumber }} | {{ employee.position }}
                        </p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <!-- Dashboard Content -->
                <div class="lg:col-span-3 space-y-6">
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="flex justify-between items-center">
                            <div class="text-sm text-gray-500">Current Pay Period: {{ currentPayPeriod }}</div>
                            <div class="flex space-x-3">
                                <button @click="timeIn"
                                    class="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors duration-200 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    :disabled="isTimedIn || isLoading">
                                    {{ isLoading && !isTimedIn ? 'Processing...' : 'Time In' }}
                                </button>
                                <button @click="timeOut"
                                    class="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors duration-200 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    :disabled="!isTimedIn || isLoading">
                                    {{ isLoading && isTimedIn ? 'Processing...' : 'Time Out' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Attendance Table -->
                    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div class="p-6 border-b border-gray-100">
                            <h2 class="text-lg font-semibold text-gray-800">My Attendance Records</h2>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date</th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time In</th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time Out</th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr v-for="record in attendanceRecords" :key="record._id" class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatDate(record.date) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.timeIn) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.timeOut) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span :class="getStatusClass(record.status)">{{ record.status }}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Salary Section -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <h2 class="text-lg font-semibold text-gray-800">Salary Details</h2>
                        <div class="pt-4 border-t-2 border-gray-200" v-if="employee">
                            <div class="flex justify-between items-center">
                                <span class="text-base font-semibold text-gray-800">Net Salary</span>
                                <span class="text-lg font-bold text-blue-600">
                                    ₱{{ calculateNetSalary(employee).toLocaleString() }}
                                </span>
                            </div>
                        </div>
                        <div v-else class="pt-4 border-t-2 border-gray-200">
                            <span class="text-base font-semibold text-gray-800">Net Salary</span>
                            <span class="text-lg font-bold text-blue-600">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>