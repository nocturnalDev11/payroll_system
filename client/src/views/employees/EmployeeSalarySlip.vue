<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div class="max-w-6xl mx-auto">
            <div class="bg-white p-6 rounded-xl shadow-md">
                <h2 class="text-2xl font-semibold mb-6 text-gray-900">My Salary Slip</h2>

                <table v-if="employee" class="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                ID</th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Name</th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Earnings</th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Deductions</th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Net Salary</th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Period</th>
                            <th scope="col" class="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase">
                                Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 text-center">
                                {{ employee.id }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">
                                {{ employee.name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">
                                ₱{{ employee.totalEarnings.toLocaleString() }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">
                                ₱{{ employee.totalDeductions.toLocaleString() }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">
                                ₱{{ employee.totalSalary.toLocaleString() }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">
                                {{ employee.salaryMonth }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-end">
                                <button @click="generatePayslip"
                                    class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700 transition-all duration-200 mr-2"
                                    :disabled="isGenerating">
                                    {{ isGenerating ? 'Generating...' : 'Generate Payslip' }}
                                </button>
                                <button @click="sendPayslipEmail"
                                    class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-700 transition-all duration-200"
                                    :disabled="isSending">
                                    {{ isSending ? 'Sending...' : 'Send Email' }}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Loading/Error State -->
                <div v-else class="text-center py-8 text-gray-500">
                    {{ errorMessage || 'Loading employee data...' }}
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

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import jsPDF from 'jspdf';

const router = useRouter();
const authStore = useAuthStore();

const employee = ref(null);
const isGenerating = ref(false);
const isSending = ref(false);
const statusMessage = ref('');
const errorMessage = ref('');

onMounted(() => {
    fetchEmployeeData();
});

async function fetchEmployeeData() {
    try {
        const employeeId = localStorage.getItem('employeeId') || authStore.employee?.employeeIdNumber;
        if (!employeeId) {
            errorMessage.value = 'User not logged in. Redirecting to login...';
            setTimeout(() => router.push('/login'), 2000);
            return;
        }

        // Use singular /api/employee and fetch from auth store or API
        const response = await axios.get('http://localhost:5000/api/employee/profile', {
            headers: {
                'Authorization': `Bearer ${authStore.accessToken}`
            }
        });
        const emp = response.data;
        employee.value = {
            id: emp._id,
            name: `${emp.firstName} ${emp.lastName}`,
            totalEarnings: calculateEarnings(emp),
            totalDeductions: calculateDeductions(emp),
            totalSalary: calculateNetSalary(emp),
            salaryMonth: new Date().toISOString().slice(0, 7), // Default to current month
            email: emp.email
        };
    } catch (error) {
        console.error('Error fetching employee data:', error);
        errorMessage.value = 'Failed to load salary slip. Please check your connection or try again later.';
        employee.value = null;
    }
}

function calculateEarnings(emp) {
    const baseEarnings = (emp.earnings?.travelExpenses || 0) + (emp.earnings?.otherEarnings || 0);
    const payheadEarnings = emp.payheads
        ?.filter(p => p.type === 'Earnings')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    return (emp.salary || 0) + baseEarnings + payheadEarnings;
}

function calculateDeductions(emp) {
    const baseDeductions = (emp.deductions?.sss || 0) + (emp.deductions?.philhealth || 0) + (emp.deductions?.pagibig || 0);
    const payheadDeductions = emp.payheads
        ?.filter(p => p.type === 'Deductions')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    return baseDeductions + payheadDeductions;
}

function calculateNetSalary(emp) {
    return calculateEarnings(emp) - calculateDeductions(emp);
}

async function generatePayslip() {
    if (!employee.value) {
        statusMessage.value = 'No employee data available to generate payslip.';
        setTimeout(() => statusMessage.value = '', 3000);
        return;
    }

    isGenerating.value = true;
    statusMessage.value = '';
    try {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Salary Slip', 20, 20);

        doc.setFontSize(12);
        doc.text(`ID: ${employee.value.id}`, 20, 40);
        doc.text(`Name: ${employee.value.name}`, 20, 50);
        doc.text(`Period: ${employee.value.salaryMonth}`, 20, 60);
        doc.text(`Total Earnings: ₱${employee.value.totalEarnings.toLocaleString()}`, 20, 70);
        doc.text(`Total Deductions: ₱${employee.value.totalDeductions.toLocaleString()}`, 20, 80);
        doc.text(`Net Salary: ₱${employee.value.totalSalary.toLocaleString()}`, 20, 90);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 100);

        const pdfBlob = doc.output('blob');
        const base64data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(pdfBlob);
        });

        localStorage.setItem(`payslip_${employee.value.id}_${employee.value.salaryMonth}`, base64data);

        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = `payslip-${employee.value.name}-${employee.value.salaryMonth}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        await axios.post(`http://localhost:5000/api/payslips/generate`, {
            employeeId: employee.value.id,
            payslipData: base64data,
            salaryMonth: employee.value.salaryMonth
        });

        statusMessage.value = 'Payslip generated successfully!';
    } catch (error) {
console.error('Error generating payslip:', error);
        statusMessage.value = error.response?.data?.message || 'Failed to generate payslip. Please try again.';
    } finally {
        isGenerating.value = false;
        setTimeout(() => statusMessage.value = '', 3000);
    }
}

async function sendPayslipEmail() {
    if (!employee.value) {
        statusMessage.value = 'No employee data available to send payslip.';
        setTimeout(() => statusMessage.value = '', 3000);
        return;
    }

    isSending.value = true;
    statusMessage.value = '';
    try {
        const payslipKey = `payslip_${employee.value.id}_${employee.value.salaryMonth}`;
        let payslipData = localStorage.getItem(payslipKey);

        if (!payslipData) {
            await generatePayslip();
            payslipData = localStorage.getItem(payslipKey);
        }

        const response = await axios.post(`http://localhost:5000/api/payslips/send-email`, {
            employeeId: employee.value.id,
            employeeEmail: employee.value.email,
            payslipData: payslipData,
            salaryMonth: employee.value.salaryMonth
        });

        if (response.status === 200) {
            statusMessage.value = 'Payslip sent to your email successfully!';
        }
    } catch (error) {
        console.error('Error sending payslip email:', error);
        statusMessage.value = 'Failed to send payslip email. Please try again.';
    } finally {
        isSending.value = false;
        setTimeout(() => statusMessage.value = '', 3000);
    }
}
</script>

<style scoped>
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