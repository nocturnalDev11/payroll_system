<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { BASE_API_URL } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth.store';
import axios from 'axios';

// State
const employee = ref(null);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const isGenerating = ref(false);
const statusMessage = ref('');
const errorMessage = ref('');
const showPayslipModal = ref(false);
const payslipDataUrl = ref('');
const iframeError = ref(false);
const payslips = ref({});
const router = useRouter();
const authStore = useAuthStore();

// Methods
const fetchEmployeeData = async () => {
    try {
        const employeeId = authStore.employee?.employeeIdNumber;
        if (!employeeId) {
            errorMessage.value = 'User not logged in. Redirecting to login...';
            setTimeout(() => router.push('/login'), 2000);
            return;
        }

        const response = await axios.get(`${BASE_API_URL}/api/employees/${employeeId}/salary`, {
            params: { month: selectedMonth.value },
            headers: { 'Authorization': `Bearer ${authStore.accessToken}` }
        });

        if (!response.data) throw new Error('No salary data returned from server');
        employee.value = response.data;
        errorMessage.value = '';
    } catch (error) {
        console.error('Error fetching employee data:', error);
        errorMessage.value = 'Failed to load salary slip. Please check your connection or try again later.';
        employee.value = null;
    }
};

const generatePayslip = async () => {
    if (!employee.value) {
        showErrorMessage('No employee data available to generate payslip.');
        return;
    }

    isGenerating.value = true;
    statusMessage.value = '';
    try {
        const response = await axios.post(`${BASE_API_URL}/api/payslips/generate`, {
            employeeId: authStore.employee?._id,
            salaryMonth: selectedMonth.value
        }, {
            headers: { 'Authorization': `Bearer ${authStore.accessToken}` }
        });

        const pdfUrl = response.data.payslipData;
        payslips.value[`${employee.value.id}_${employee.value.salaryMonth}`] = pdfUrl;
        payslipDataUrl.value = pdfUrl;
        // Refresh employee data after generating payslip to get updated calculations
        await fetchEmployeeData();
        showSuccessMessage('Payslip generated successfully!');
    } catch (error) {
        console.error('Error generating payslip:', error);
        if (error.response?.status === 401) {
            showErrorMessage('Unauthorized. Please log in again.');
            setTimeout(() => router.push('/login'), 2000);
        } else {
            showErrorMessage(error.response?.data?.message || 'Failed to generate payslip. Please try again.');
        }
    } finally {
        isGenerating.value = false;
    }
};

const viewPayslip = () => {
    if (!payslipDataUrl.value) {
        showErrorMessage('Please generate the payslip first.');
        return;
    }
    showPayslipModal.value = true;
    iframeError.value = false;
    showSuccessMessage(`Viewing payslip for ${employee.value.name} for ${employee.value.salaryMonth}`);
};

const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const onIframeLoad = () => {
    console.log('iFrame loaded successfully');
    iframeError.value = false;
};

const onIframeError = () => {
    console.error('iFrame failed to load');
    iframeError.value = true;
};

const showSuccessMessage = (message) => {
    statusMessage.value = message;
    setTimeout(() => statusMessage.value = '', 3000);
};

const showErrorMessage = (message) => {
    statusMessage.value = message;
    setTimeout(() => statusMessage.value = '', 3000);
};

// Computed properties for detailed breakdown
const earningsBreakdown = computed(() => {
    if (!employee.value?.earnings) return [];
    return employee.value.earnings.map(e => ({
        name: e.name,
        amount: formatNumber(e.amount)
    }));
});

const deductionsBreakdown = computed(() => {
    if (!employee.value?.deductions) return [];
    const customDeds = employee.value.deductions.customDeductions?.map(d => ({
        name: d.name,
        amount: formatNumber(d.amount)
    })) || [];
    return [
        ...customDeds,
        { name: 'SSS Contribution', amount: formatNumber(employee.value.deductions.sss) },
        { name: 'PhilHealth Contribution', amount: formatNumber(employee.value.deductions.philHealth) },
        { name: 'Pag-IBIG Contribution', amount: formatNumber(employee.value.deductions.pagIbig) },
        { name: 'Withholding Tax', amount: formatNumber(employee.value.deductions.tax) }
    ];
});

// Lifecycle
onMounted(() => {
    fetchEmployeeData();
});
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div class="max-w-[90rem] mx-auto">
            <div class="bg-white p-6 rounded-xl shadow-md">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-semibold text-gray-900">My Salary Slip</h2>
                    <input v-model="selectedMonth" type="month"
                        class="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        @change="fetchEmployeeData" />
                </div>

                <div v-if="employee" class="space-y-6">
                    <!-- Summary Table -->
                    <table class="min-w-full border border-gray-300">
                        <thead class="bg-gray-200">
                            <tr>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    ID
                                </th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Name
                                </th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Hourly Rate
                                </th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total Earnings
                                </th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total
                                    Deductions
                                </th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net
                                    Salary
                                </th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Period
                                </th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="hover:bg-gray-50">
                                <td class="border px-4 py-2 text-sm text-gray-900">{{ employee.id }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900">{{ employee.name }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900">₱{{ formatNumber(employee.hourlyRate)
                                    }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900">₱{{
                                    formatNumber(employee.totalEarnings) }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900">₱{{
                                    formatNumber(employee.totalDeductions) }}</td>
                                <td class="border px-4 py-2 text-sm font-bold text-gray-900">₱{{
                                    formatNumber(employee.totalSalary) }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900">{{ employee.salaryMonth }}</td>
                                <td class="border px-4 py-2 text-sm">
                                    <button @click="generatePayslip"
                                        class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700 transition-all duration-200 mr-2"
                                        :disabled="isGenerating">
                                        {{ isGenerating ? 'Generating...' : 'Generate Payslip' }}
                                    </button>
                                    <button @click="viewPayslip"
                                        class="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-all duration-200"
                                        :disabled="!payslipDataUrl || isGenerating">
                                        View Payslip
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Detailed Breakdown -->
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">Deductions</h3>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div v-for="deduction in deductionsBreakdown" :key="deduction.name"
                                class="flex justify-between py-1">
                                <span>{{ deduction.name }}</span>
                                <span>₱{{ deduction.amount }}</span>
                            </div>
                            <div class="border-t pt-2 mt-2 font-semibold flex justify-between">
                                <span>Total Deductions</span>
                                <span>₱{{ formatNumber(employee.totalDeductions) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="text-center py-8 text-gray-500">
                    {{ errorMessage || 'Loading employee data...' }}
                </div>

                <!-- Payslip Modal -->
                <div v-if="showPayslipModal"
                    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
                        <div class="p-6 border-b flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-gray-800">
                                Payslip for {{ employee?.name }} - {{ employee?.salaryMonth }}
                            </h2>
                            <button @click="showPayslipModal = false" class="text-gray-500 hover:text-gray-700">
                                <span class="material-icons-outlined">close</span>
                            </button>
                        </div>
                        <div class="p-6">
                            <iframe :src="payslipDataUrl" class="w-full h-[70vh]" frameborder="0" @load="onIframeLoad"
                                @error="onIframeError"></iframe>
                            <p v-if="iframeError" class="text-red-500 text-sm mt-2">
                                Error loading payslip. Please ensure the payslip is generated correctly or try again.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Status Message -->
                <div v-if="statusMessage"
                    :class="statusMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                    class="mt-4 p-3 rounded-lg text-center">
                    {{ statusMessage }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined');

table {
    border-collapse: collapse;
    width: 100%;
}

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
