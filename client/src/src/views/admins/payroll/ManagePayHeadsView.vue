<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div class="max-w-6xl mx-auto">
            <!-- Add Pay Head Button -->
            <button
                class="mb-4 py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
                @click="showAddModal = true">Add Pay Head</button>

            <!-- Add Pay Head Modal -->
            <PayHeadModal v-if="showAddModal" @close="showAddModal = false" @save="addPayHead" :pay-head="newPayHead" />

            <!-- Update Pay Head Modal -->
            <PayHeadModal v-if="showUpdateModal" @close="showUpdateModal = false" @save="updatePayHead"
                :pay-head="selectedPayHead" is-update />

            <!-- Table to Display Pay Heads -->
            <PayHeadTable :pay-heads="payHeads" @update="showUpdatePayHeadModal" @delete="deletePayHead" />

            <!-- Employee Payroll Information -->
            <EmployeePayrollTable :employees="employees" @add-payhead="openAddPayheadModal" />

            <!-- Add/Edit Payhead to Employee Modal -->
            <AddPayheadModal v-if="showAddPayheadModal" @close="showAddPayheadModal = false" @save="savePayheads"
                :available-payheads="availablePayheads" :selected-employee-payheads="selectedEmployeePayheads"
                @add-payhead="addPayheadToEmployee" @remove-payhead="removePayheadFromEmployee"
                @update-payhead="updatePayheadInEmployee" :total-payable-salary="totalPayableSalary"
                :selected-employee="selectedEmployee" />
        </div>

        <!-- Status Message -->
        <div v-if="statusMessage"
            :class="statusMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
            class="fixed bottom-4 right-4 p-4 rounded-lg shadow-md z-50">
            {{ statusMessage }}
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { BASE_API_URL } from '../../../utils/constants.js';
import PayHeadModal from './Partials/PayHeadModal.vue';
import PayHeadTable from './Partials/PayHeadTable.vue';
import EmployeePayrollTable from './Partials/EmployeePayrollTable.vue';
import AddPayheadModal from './Partials/AddPayHeadModal.vue';

const payHeads = ref([]);
const employees = ref([]);
const newPayHead = ref({ name: '', amount: '', type: 'Earnings' });
const selectedPayHead = ref({ id: '', name: '', amount: '', type: 'Earnings' });
const showAddModal = ref(false);
const showUpdateModal = ref(false);
const showAddPayheadModal = ref(false);
const selectedEmployee = ref(null);
const selectedEmployeePayheads = ref([]);
const availablePayheads = ref([]);
const statusMessage = ref('');

const totalPayableSalary = computed(() => {
    const earnings = selectedEmployeePayheads.value
        .filter(p => p.type === 'Earnings')
        .reduce((sum, p) => sum + Number(p.amount), 0);
    const deductions = selectedEmployeePayheads.value
        .filter(p => p.type === 'Deductions')
        .reduce((sum, p) => sum + Number(p.amount), 0);
    return selectedEmployee.value ? (selectedEmployee.value.salary || 0) + earnings - deductions : 0;
});

onMounted(async () => {
    await fetchPayHeads();
    await fetchEmployees();
});

async function fetchPayHeads() {
    try {
        const response = await axios.get(`${BASE_API_URL}/api/payheads`);
        payHeads.value = response.data.map(ph => ({
            ...ph,
            id: ph._id // Map _id to id
        })) || [];
    } catch (error) {
        console.error('Error fetching pay heads:', error);
        showErrorMessage('Failed to fetch pay heads.');
    }
}

async function fetchEmployees() {
    try {
        const response = await axios.get(`${BASE_API_URL}/api/employee`);
        employees.value = response.data.map(emp => ({
            ...emp,
            id: emp._id, // Map _id to id
            name: `${emp.firstName} ${emp.lastName}`,
            position: emp.position || 'N/A',
            totalEarnings: calculateEarnings(emp.payheads || []),
            totalDeduction: calculateDeductions(emp.payheads || []),
            totalSalary: (emp.salary || 0) + calculateEarnings(emp.payheads || []) - calculateDeductions(emp.payheads || []),
            payheads: emp.payheads || []
        })) || [];
    } catch (error) {
        console.error('Error fetching employees:', error);
        showErrorMessage('Failed to fetch employees.');
    }
}

async function addPayHead(payHead) {
    try {
        const response = await axios.post(`${BASE_API_URL}/api/payheads`, payHead);
        payHeads.value.push(response.data);
        showAddModal.value = false;
        showSuccessMessage('Pay head added successfully!');
    } catch (error) {
        console.error('Error adding pay head:', error);
        showErrorMessage('Failed to add pay head.');
    }
}

function showUpdatePayHeadModal(payHead) {
    if (!payHead || !payHead.id) {
        console.error('Invalid payHead object:', payHead);
        showErrorMessage('Cannot update payhead: Invalid ID');
        return;
    }
    selectedPayHead.value = { ...payHead };
    showUpdateModal.value = true;
}

async function updatePayHead(updatedPayHead) {
    if (!updatedPayHead.id) {
        console.error('No ID provided for update:', updatedPayHead);
        showErrorMessage('Cannot update payhead: Missing ID');
        return;
    }

    try {
        const response = await axios.put(`${BASE_API_URL}/api/payheads/${updatedPayHead.id}`, updatedPayHead);
        const index = payHeads.value.findIndex(ph => ph.id === updatedPayHead.id);
        if (index !== -1) {
            payHeads.value.splice(index, 1, { ...response.data, id: response.data._id });
            showUpdateModal.value = false;
            showSuccessMessage('Pay head updated successfully!');
            await fetchEmployees();
        }
    } catch (error) {
        console.error('Error updating pay head:', error);
        showErrorMessage('Failed to update pay head: ' + (error.response?.data?.message || error.message));
    }
}

async function deletePayHead(id) {
    try {
        await axios.delete(`${BASE_API_URL}/api/payheads/${id}`);
        payHeads.value = payHeads.value.filter(payHead => payHead.id !== id);
        showSuccessMessage('Pay head deleted successfully!');
        await fetchEmployees();
    } catch (error) {
        console.error('Error deleting pay head:', error);
        showErrorMessage('Failed to delete pay head.');
    }
}

function openAddPayheadModal(employee) {
    selectedEmployee.value = { ...employee };
    selectedEmployeePayheads.value = [...(employee.payheads || [])];
    availablePayheads.value = [...payHeads.value];
    showAddPayheadModal.value = true;
}

function addPayheadToEmployee(payhead) {
    const newPayhead = { ...payhead, uniqueId: Date.now() + Math.random() };
    selectedEmployeePayheads.value.push(newPayhead);
}

function removePayheadFromEmployee(payhead) {
    selectedEmployeePayheads.value = selectedEmployeePayheads.value.filter(p => p.uniqueId !== payhead.uniqueId);
}

function updatePayheadInEmployee(updatedPayhead) {
    const index = selectedEmployeePayheads.value.findIndex(p => p.uniqueId === updatedPayhead.uniqueId);
    if (index !== -1) {
        selectedEmployeePayheads.value.splice(index, 1, { ...updatedPayhead });
    }
}

async function savePayheads() {
    try {
        const payheadsToSave = selectedEmployeePayheads.value.map(ph => ({
            id: ph.id ?? undefined, // Only include id if it exists
            name: ph.name,
            amount: ph.amount,
            type: ph.type
        }));

        const updatedEmployee = {
            ...selectedEmployee.value,
            payheads: payheadsToSave,
            totalEarnings: calculateEarnings(payheadsToSave),
            totalDeduction: calculateDeductions(payheadsToSave),
            totalSalary: (selectedEmployee.value.salary || 0) + calculateEarnings(payheadsToSave) - calculateDeductions(payheadsToSave)
        };

        await axios.put(`${BASE_API_URL}/api/employee/${selectedEmployee.value.id}`, updatedEmployee);

        const employeeIndex = employees.value.findIndex(e => e.id === selectedEmployee.value.id);
        if (employeeIndex !== -1) {
            employees.value.splice(employeeIndex, 1, updatedEmployee);
        }

        showAddPayheadModal.value = false;
        showSuccessMessage('Payheads saved to employee successfully!');
    } catch (error) {
        console.error('Error saving payheads:', error);
        showErrorMessage('Failed to save payheads.');
    }
}

function calculateEarnings(payheads) {
    return payheads
        .filter(p => p.type === 'Earnings')
        .reduce((sum, p) => sum + Number(p.amount), 0);
}

function calculateDeductions(payheads) {
    return payheads
        .filter(p => p.type === 'Deductions')
        .reduce((sum, p) => sum + Number(p.amount), 0);
}

function showSuccessMessage(message) {
    statusMessage.value = message;
    setTimeout(() => statusMessage.value = '', 3000);
}

function showErrorMessage(message) {
    statusMessage.value = message;
    setTimeout(() => statusMessage.value = '', 3000);
}
</script>

<style scoped>
.transition-all {
    transition: all 0.2s ease-in-out;
}
</style>