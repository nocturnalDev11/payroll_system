<script setup>
import { ref, onMounted } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';
import ViewEmployeeDetails from './Partials/ViewEmployeeDetails.vue';
import EditEmployee from './Partials/EditEmployee.vue';
import DeleteEmployee from './Partials/DeleteEmployee.vue';
import RequestInfo from './Partials/RequestInfo.vue';

// State
const employees = ref([]);
const totalEmployees = ref(0);
const isLoading = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);
const pendingRequests = ref([]);
const selectedRequest = ref(null);
const showRequestModal = ref(false);
const isEditingRequest = ref(false);

// Predefined positions (example)
const adminPositions = ref(['Developer', 'Manager', 'HR', 'Accountant']);

// Fetch all employees (only approved ones)
const fetchAllEmployees = async () => {
    isLoading.value = true;
    try {
        const response = await fetch(`${BASE_API_URL}/api/employee/`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch employees');
        const allEmployees = await response.json();
        // Filter to only include approved employees
        employees.value = allEmployees.filter(emp => emp.status === 'approved');
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        showErrorMessage('Failed to load employees. Please try again.');
    } finally {
        isLoading.value = false;
    }
};

// Fetch total employees
const fetchTotalEmployees = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employee/total`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch total employees');
        totalEmployees.value = (await response.json()).total;
    } catch (error) {
        console.error('Failed to fetch total employees:', error);
        showErrorMessage('Failed to load total employees count.');
    }
};

// Refresh employees
const refreshEmployees = () => {
    fetchAllEmployees();
    fetchTotalEmployees();
};

// Calculate net salary
const calculateNetSalary = (employee) => {
    const salary = employee.salary || 0;
    const deductions = (employee.deductions?.sss || 0) +
        (employee.deductions?.philHealth || 0) +
        (employee.deductions?.pagibig || 0);
    const earnings = (employee.earnings?.travelExpenses || 0) +
        (employee.earnings?.otherEarnings || 0);
    return salary - deductions + earnings;
};

// Handle employee updates
const handleEmployeeUpdated = (updatedEmployee) => {
    const index = employees.value.findIndex(emp => emp._id === updatedEmployee._id);
    if (index !== -1) employees.value[index] = updatedEmployee;
};

// Handle employee deletion
const handleEmployeeDeleted = (id) => {
    employees.value = employees.value.filter(emp => emp._id !== id);
    totalEmployees.value--;
};

// Refresh pending requests
const refreshPendingRequests = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employee/pending`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch pending requests');
        pendingRequests.value = (await response.json()).map(employee => ({
            id: employee._id,
            name: `${employee.firstName} ${employee.lastName}`,
            positionApplied: employee.position,
            salary: employee.salary,
            email: employee.email,
            contactNumber: employee.contactInfo,
            deductions: employee.deductions,
            earnings: employee.earnings,
        }));
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        showErrorMessage('Failed to load pending requests');
    }
};

// Save request changes
const saveRequestChanges = async () => {
    if (!selectedRequest.value?.name || !selectedRequest.value?.email || !selectedRequest.value?.contactNumber) {
        showErrorMessage('Required fields are missing');
        return;
    }
    if (selectedRequest.value.salary < 0) {
        showErrorMessage('Salary cannot be negative');
        return;
    }

    try {
        const [firstName, ...lastNameParts] = selectedRequest.value.name.split(' ');
        const lastName = lastNameParts.join(' ');
        const updatedEmployee = {
            firstName,
            lastName,
            position: selectedRequest.value.positionApplied,
            salary: selectedRequest.value.salary,
            email: selectedRequest.value.email,
            contactInfo: selectedRequest.value.contactNumber,
            deductions: selectedRequest.value.deductions,
            earnings: selectedRequest.value.earnings,
        };
        const response = await fetch(`${BASE_API_URL}/api/employee/update/${selectedRequest.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEmployee),
        });
        if (!response.ok) throw new Error('Failed to save changes');
        const data = await response.json();
        const index = pendingRequests.value.findIndex(req => req.id === selectedRequest.value.id);
        if (index !== -1) pendingRequests.value[index] = { ...selectedRequest.value, ...data.updatedEmployee };
        showSuccessMessage('Request updated successfully');
        isEditingRequest.value = false;
    } catch (error) {
        console.error('Error saving request changes:', error);
        showErrorMessage('Failed to save changes');
    }
};

// Approve request
const approveRequest = async (request) => {
    try {
        const updatedEmployee = {
            status: 'approved',
            hireDate: new Date(),
            username: request.username || `${request.name.split(' ')[0].toLowerCase()}${Math.floor(Math.random() * 1000)}`,
            password: 'defaultPassword123', // Should be hashed on backend
            employeeIdNumber: request.employeeIdNumber || `EMP${Date.now()}`,
        };
        const response = await fetch(`${BASE_API_URL}/api/employee/update/${request.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEmployee),
        });
        if (!response.ok) throw new Error('Failed to approve employee');
        const data = await response.json();
        pendingRequests.value = pendingRequests.value.filter(req => req.id !== request.id);
        employees.value.push(data.updatedEmployee);
        showRequestModal.value = false;
        showSuccessMessage('Employee approved successfully');
    } catch (error) {
        console.error('Error approving request:', error);
        showErrorMessage('Error approving employee');
    }
};

// Reject request
const rejectRequest = async (id) => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employee/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected' }),
        });
        if (!response.ok) throw new Error('Failed to reject application');
        pendingRequests.value = pendingRequests.value.filter(req => req.id !== id);
        showRequestModal.value = false;
        showSuccessMessage('Application rejected successfully');
    } catch (error) {
        console.error('Error rejecting request:', error);
        showErrorMessage('Error rejecting application');
    }
};

// View request info
const viewRequestInfo = (request) => {
    selectedRequest.value = {
        id: request.id,
        name: request.name,
        positionApplied: request.positionApplied,
        salary: request.salary,
        email: request.email,
        contactNumber: request.contactNumber,
        deductions: { ...request.deductions },
        earnings: { ...request.earnings },
    };
    showRequestModal.value = true;
    isEditingRequest.value = false;
};

// Close modal
const closeRequestModal = () => {
    showRequestModal.value = false;
    isEditingRequest.value = false;
};

// Notification helpers
const showSuccessMessage = (msg) => {
    successMessage.value = msg;
    setTimeout(() => (successMessage.value = null), 3000);
};
const showErrorMessage = (msg) => {
    errorMessage.value = msg;
    setTimeout(() => (errorMessage.value = null), 3000);
};

// Lifecycle
onMounted(() => {
    fetchAllEmployees();
    fetchTotalEmployees();
    refreshPendingRequests();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50 p-4">
        <!-- Notifications -->
        <div v-if="successMessage" class="bg-green-100 text-green-800 p-2 rounded mb-4">{{ successMessage }}</div>
        <div v-if="errorMessage" class="bg-red-100 text-red-800 p-2 rounded mb-4">{{ errorMessage }}</div>

        <div class="flex gap-6">
            <!-- Left side - Employee List -->
            <div class="flex-1">
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-6 flex justify-between items-center">
                        <h2 class="text-xl font-bold text-gray-800">Employee List (Total: {{ totalEmployees }})</h2>
                        <button @click="refreshEmployees"
                            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                            :disabled="isLoading">
                            {{ isLoading ? 'Loading...' : 'Refresh' }}
                        </button>
                    </div>
                    <div class="overflow-x-auto min-h-[200px]">
                        <table class="w-full">
                            <thead class="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Employee ID</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Name</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Position</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Total Salary</th>
                                    <th class="px-6 py-4 text-right text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                <tr v-for="employee in employees" :key="employee._id"
                                    class="hover:bg-gray-50 transition duration-200">
                                    <td class="px-6 py-4 text-sm text-gray-900">{{ employee.employeeIdNumber }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">{{ employee.firstName }} {{
                                        employee.lastName }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">{{ employee.position }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">₱{{
                                        calculateNetSalary(employee).toLocaleString() }}</td>
                                    <td class="px-6 py-4 text-right flex justify-end gap-3">
                                        <ViewEmployeeDetails :employee="employee" />
                                        <EditEmployee :employee="employee" @employee-updated="handleEmployeeUpdated" />
                                        <DeleteEmployee :employee="employee"
                                            @employee-deleted="handleEmployeeDeleted" />
                                    </td>
                                </tr>
                                <tr v-if="employees.length === 0 && !isLoading">
                                    <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">No employees
                                        found.</td>
                                </tr>
                                <tr v-if="isLoading">
                                    <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Right side - Pending Approvals -->
            <div class="w-96">
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 class="text-xl font-bold text-gray-800">Pending Approvals</h2>
                        <button @click="refreshPendingRequests"
                            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200">
                            Refresh
                        </button>
                    </div>
                    <div class="divide-y divide-gray-100">
                        <div v-for="request in pendingRequests" :key="request.id" class="p-4">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h3 class="text-sm font-medium text-gray-900">{{ request.name }}</h3>
                                    <p class="text-sm text-gray-500">{{ request.positionApplied }}</p>
                                </div>
                                <span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    Pending
                                </span>
                            </div>
                            <div class="flex gap-2">
                                <RequestInfo :request="selectedRequest" :show="showRequestModal"
                                    :is-editing="isEditingRequest" :positions="adminPositions"
                                    @close="closeRequestModal" @save="saveRequestChanges" />
                                <button @click="viewRequestInfo(request)"
                                    class="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition duration-200">
                                    View Info
                                </button>
                                <button @click="approveRequest(request)"
                                    class="text-sm px-3 py-1 text-green-600 hover:bg-green-50 rounded-md transition duration-200">
                                    Approve
                                </button>
                                <button @click="rejectRequest(request.id)"
                                    class="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition duration-200">
                                    Reject
                                </button>
                            </div>
                        </div>
                        <div v-if="pendingRequests.length === 0" class="p-4 text-center text-sm text-gray-500">
                            No pending approvals.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.transition-colors {
    transition: all 0.2s ease-in-out;
}
</style>