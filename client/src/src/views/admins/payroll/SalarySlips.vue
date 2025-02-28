<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div class="max-w-6xl mx-auto">
            <div class="flex justify-between items-center mb-4 gap-4">
                <input v-model="searchQuery" type="text" placeholder="Search Employee..."
                    class="border rounded-lg px-4 py-2 w-1/3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                <input v-model="selectedMonth" type="month"
                    class="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    @change="fetchEmployees" />
                <button @click="refreshData"
                    class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200"
                    :disabled="isLoading">
                    {{ isLoading ? 'Refreshing...' : 'Refresh' }}
                </button>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-md">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Earnings
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Deductions
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary Month
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="employee in paginatedEmployees" :key="employee.id" class="hover:bg-gray-50">
                            <td class="px-6 py-4 text-sm text-gray-900">{{ employee.name }}</td>
                            <td class="px-6 py-4 text-sm text-gray-900">₱{{ employee.totalEarnings.toLocaleString() }}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-900">₱{{ employee.totalDeductions.toLocaleString() }}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-900 font-bold">₱{{
                                employee.totalSalary.toLocaleString() }}</td>
                            <td class="px-6 py-4 text-sm text-gray-900">{{ employee.salaryMonth }}</td>
                            <td class="px-6 py-4 text-sm font-medium flex gap-2">
                                <button @click="generatePayslip(employee)"
                                    class="bg-green-50 text-green-600 font-semibold py-1.5 px-3 rounded-lg hover:bg-green-100 transition-all duration-200 flex items-center gap-2 text-xs"
                                    :disabled="payslipGenerationStatus[employee.id]?.generating || isLoading">
                                    <span class="material-icons text-green-600">description</span>
                                    {{ payslipGenerationStatus[employee.id]?.generating ? 'Generating...' : 'Generate'
                                    }}
                                </button>
                                <button @click="sendPayslipEmail(employee)"
                                    class="bg-blue-50 text-blue-600 font-semibold py-1.5 px-3 rounded-lg hover:bg-blue-100 transition-all duration-200 flex items-center gap-2 text-xs"
                                    :disabled="payslipGenerationStatus[employee.id]?.sending || isLoading">
                                    <span class="material-icons text-blue-600">email</span>
                                    {{ payslipGenerationStatus[employee.id]?.sending ? 'Sending...' : 'Send Email' }}
                                </button>
                            </td>
                        </tr>
                        <tr v-if="paginatedEmployees.length === 0 && !isLoading">
                            <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No employees found for
                                this month.</td>
                        </tr>
                        <tr v-if="isLoading">
                            <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">Loading employees...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="flex justify-center items-center mt-4 gap-4">
                <button @click="prevPage" :disabled="currentPage === 1 || isLoading"
                    class="bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <span class="material-icons">chevron_left</span>
                </button>
                <span class="text-gray-700">Page {{ currentPage }} of {{ totalPages }}</span>
                <button @click="nextPage" :disabled="currentPage === totalPages || isLoading"
                    class="bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <span class="material-icons">chevron_right</span>
                </button>
            </div>

            <div v-if="statusMessage"
                :class="statusMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                class="fixed bottom-4 right-4 p-4 rounded-lg shadow-md z-50">
                {{ statusMessage }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const employees = ref([]);
const searchQuery = ref('');
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const currentPage = ref(1);
const itemsPerPage = 5;
const payslipGenerationStatus = ref({});
const isLoading = ref(false);
const statusMessage = ref('');

const filteredEmployees = computed(() => {
    return employees.value.filter(employee =>
        employee.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const totalPages = computed(() => {
    return Math.ceil(filteredEmployees.value.length / itemsPerPage) || 1;
});

const paginatedEmployees = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredEmployees.value.slice(start, end);
});

onMounted(() => fetchEmployees());

async function fetchEmployees() {
    isLoading.value = true;
    statusMessage.value = '';
    try {
        const response = await axios.get('http://localhost:5000/api/employee');
        employees.value = response.data.map(employee => ({
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            totalEarnings: calculateTotalEarnings(employee),
            totalDeductions: calculateTotalDeductions(employee),
            totalSalary: calculateNetSalary(employee),
            salaryMonth: formatSalaryMonth(selectedMonth.value),
            email: employee.email,
            position: employee.position,
            rawData: employee
        })) || [];
        showSuccessMessage('Employees loaded successfully!');
    } catch (error) {
        console.error('Error fetching employees:', error);
        showErrorMessage('Failed to load employees. Please try again.');
    } finally {
        isLoading.value = false;
    }
}

async function refreshData() {
    await fetchEmployees();
}

function calculateTotalEarnings(employee) {
    const baseEarnings = (employee.earnings?.travelExpenses || 0) + (employee.earnings?.otherEarnings || 0);
    const payheadEarnings = employee.payheads
        ?.filter(p => p.type === 'Earnings')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    return (employee.salary || 0) + baseEarnings + payheadEarnings;
}

function calculateTotalDeductions(employee) {
    const payheadDeductions = employee.payheads
        ?.filter(p => p.type === 'Deductions')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    return payheadDeductions;
}

function calculateNetSalary(employee) {
    return calculateTotalEarnings(employee) - calculateTotalDeductions(employee);
}

function formatSalaryMonth(month) {
    const [year, monthNum] = month.split('-');
    return `${monthNum}/01/${year}`;
}

async function generatePayslip(employee) {
    payslipGenerationStatus.value[employee.id] = { generating: true };
    statusMessage.value = '';
    try {
        const response = await axios.post('http://localhost:5000/api/payslips/generate', {
            employeeId: employee.id,
            salaryMonth: employee.salaryMonth
        });

        const base64data = response.data.payslipData; // Expecting base64 PDF from backend
        const byteCharacters = atob(base64data.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = `payslip-${employee.name}-${employee.salaryMonth}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        localStorage.setItem(`payslip_${employee.id}_${employee.salaryMonth}`, base64data);
        showSuccessMessage(`Payslip generated for ${employee.name}`);
    } catch (error) {
        console.error('Error generating payslip:', error);
        showErrorMessage(`Failed to generate payslip for ${employee.name}`);
    } finally {
        payslipGenerationStatus.value[employee.id] = { generating: false };
    }
}

async function sendPayslipEmail(employee) {
    payslipGenerationStatus.value[employee.id] = { sending: true };
    statusMessage.value = '';
    try {
        const payslipKey = `payslip_${employee.id}_${employee.salaryMonth}`;
        let payslipData = localStorage.getItem(payslipKey);

        if (!payslipData) {
            await generatePayslip(employee);
            payslipData = localStorage.getItem(payslipKey);
        }

        if (!payslipData || !payslipData.startsWith('data:application/pdf;base64,')) {
            throw new Error('Invalid or missing payslipData');
        }

        const response = await axios.post('http://localhost:5000/api/payslips/send-email', {
            employeeId: employee.id,
            employeeEmail: employee.email,
            payslipData,
            salaryMonth: employee.salaryMonth
        });

        if (response.status === 200) {
            showSuccessMessage(`Payslip email sent to ${employee.name} at ${employee.email}`);
        }
    } catch (error) {
        console.error('Error sending payslip email:', error);
        showErrorMessage(`Failed to send payslip email to ${employee.name}: ${error.message}`);
    } finally {
        payslipGenerationStatus.value[employee.id] = { sending: false };
    }
}

function nextPage() {
    if (currentPage.value < totalPages.value) currentPage.value++;
}

function prevPage() {
    if (currentPage.value > 1) currentPage.value--;
}

function showSuccessMessage(message) {
    statusMessage.value = message;
    setTimeout(() => (statusMessage.value = ''), 3000);
}

function showErrorMessage(message) {
    statusMessage.value = message;
    setTimeout(() => (statusMessage.value = ''), 3000);
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

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