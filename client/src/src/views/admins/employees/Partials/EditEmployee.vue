<script setup>
import { ref, watch } from 'vue';
import Modal from '@/components/Modal.vue';
import { BASE_API_URL } from '@/utils/constants.js';

// Define props and emits
const props = defineProps(['employee']);
const emit = defineEmits(['employee-updated']);

// Reactive state
const showEditModal = ref(false);
const form = ref({});
const isUpdating = ref(false);
const adminPositions = ref(['Developer', 'Manager', 'Designer', 'Analyst']);

// Sync form with employee prop when it changes
watch(() => props.employee, (newEmployee) => {
    if (newEmployee) {
        form.value = { ...newEmployee };
    }
}, { immediate: true });

const closeEditModal = () => {
    showEditModal.value = false;
};

const updateEmployee = async () => {
    isUpdating.value = true;
    try {
        console.log('Sending payload:', form.value); // Debug
        const response = await fetch(`${BASE_API_URL}/api/employee/update/${props.employee._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form.value),
        });
        if (!response.ok) throw new Error('Failed to update employee');
        const updatedEmployee = await response.json();
        console.log('Response:', updatedEmployee); // Debug
        emit('employee-updated', updatedEmployee.updatedEmployee);
        closeEditModal();
    } catch (error) {
        console.error('Update failed:', error);
        alert('Failed to update employee.');
    } finally {
        isUpdating.value = false;
    }
};

const calculateNetSalary = (employee) => {
    const salary = employee.salary || 0;
    const deductions = (employee.deductions?.sss || 0) +
        (employee.deductions?.philHealth || 0) +
        (employee.deductions?.pagibig || 0);
    const earnings = (employee.earnings?.travelExpenses || 0) +
        (employee.earnings?.otherEarnings || 0);
    return salary - deductions + earnings;
};
</script>

<template>
    <button @click="showEditModal = true" class="text-yellow-600 hover:text-yellow-800 transition duration-200">
        edit
    </button>

    <Modal :show="showEditModal" @close="closeEditModal">
        <form @submit.prevent="updateEmployee">
            <div class="p-6 border-b">
                <h2 class="text-2xl font-bold text-gray-800">Edit Employee</h2>
            </div>
            <div class="p-6">
                <!-- Basic Information -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-gray-700">First Name</label>
                            <input v-model="form.firstName" class="w-full p-2 border border-gray-200 rounded-lg"
                                required />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-gray-700">Last Name</label>
                            <input v-model="form.lastName" class="w-full p-2 border border-gray-200 rounded-lg"
                                required />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-gray-700">Position</label>
                            <select v-model="form.position" class="w-full p-2 border border-gray-200 rounded-lg"
                                required>
                                <option v-for="position in adminPositions" :key="position" :value="position">
                                    {{ position }}
                                </option>
                            </select>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-gray-700">Base Salary</label>
                            <input v-model.number="form.salary" type="number"
                                class="w-full p-2 border border-gray-200 rounded-lg" required min="0" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-gray-700">Email</label>
                            <input v-model="form.email" type="email"
                                class="w-full p-2 border border-gray-200 rounded-lg" required />
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-gray-700">Contact Info</label>
                            <input v-model="form.contactInfo" class="w-full p-2 border border-gray-200 rounded-lg"
                                required />
                        </div>
                    </div>
                </div>

                <!-- Financial Information -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Financial Information</h3>
                    <div class="grid grid-cols-2 gap-6">
                        <!-- Deductions -->
                        <div class="space-y-4">
                            <p class="text-sm font-medium text-gray-700">Monthly Deductions</p>
                            <div class="space-y-2">
                                <label class="text-sm text-gray-600">SSS</label>
                                <input v-model.number="form.deductions.sss" type="number"
                                    class="w-full p-2 border border-gray-200 rounded-lg" min="0" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-sm text-gray-600">PhilHealth</label>
                                <input v-model.number="form.deductions.philhealth" type="number"
                                    class="w-full p-2 border border-gray-200 rounded-lg" min="0" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-sm text-gray-600">Pag-IBIG</label>
                                <input v-model.number="form.deductions.pagibig" type="number"
                                    class="w-full p-2 border border-gray-200 rounded-lg" min="0" />
                            </div>
                        </div>

                        <!-- Earnings -->
                        <div class="space-y-4">
                            <p class="text-sm font-medium text-gray-700">Additional Earnings</p>
                            <div class="space-y-2">
                                <label class="text-sm text-gray-600">Travel Expenses</label>
                                <input v-model.number="form.earnings.travelExpenses" type="number"
                                    class="w-full p-2 border border-gray-200 rounded-lg" min="0" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-sm text-gray-600">Other Earnings</label>
                                <input v-model.number="form.earnings.otherEarnings" type="number"
                                    class="w-full p-2 border border-gray-200 rounded-lg" min="0" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Net Salary Preview -->
                <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-700">Net Salary Preview:</span>
                        <span class="text-lg font-semibold text-gray-900">₱{{ calculateNetSalary(form).toLocaleString()
                            }}</span>
                    </div>
                </div>
            </div>

            <div class="p-6 border-t bg-gray-50">
                <div class="flex justify-end gap-3">
                    <button type="submit"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                        :disabled="isUpdating">
                        {{ isUpdating ? 'Saving...' : 'Save Changes' }}
                    </button>
                    <button @click="showEditModal = false"
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200"
                        :disabled="isUpdating">
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    </Modal>
</template>