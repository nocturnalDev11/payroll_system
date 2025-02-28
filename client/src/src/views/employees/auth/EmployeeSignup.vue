<script setup>
import Modal from '@/components/Modal.vue';
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants';

const authStore = useAuthStore();
const showRegisterModal = ref(false);
const positions = ['Developer', 'Manager', 'Designer', 'Analyst'];

const newRequest = ref({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    contactInfo: '',
    position: '',
    civilStatus: '',
    salary: 0,
    sss: '',
    philhealth: '',
    hdmf: ''
});

const closeModal = () => {
    showRegisterModal.value = false;
    resetForm();
};

const resetForm = () => {
    newRequest.value = {
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        contactInfo: '',
        position: '',
        civilStatus: '',
        salary: 0,
        sss: '',
        philhealth: '',
        hdmf: ''
    };
};

const submitRequest = async () => {
    try {
        const payload = {
            firstName: newRequest.value.firstName,
            lastName: newRequest.value.lastName,
            username: newRequest.value.username,
            email: newRequest.value.email,
            password: newRequest.value.password,
            employeeIdNumber: `EMP-${Date.now()}`,
            contactInfo: newRequest.value.contactInfo,
            position: newRequest.value.position,
            civilStatus: newRequest.value.civilStatus,
            sss: newRequest.value.sss,
            philHealth: newRequest.value.philhealth,
            hdmf: newRequest.value.hdmf,
            salary: newRequest.value.salary
        };
        console.log('Sending payload:', payload);

        const response = await fetch(`${BASE_API_URL}/api/employee/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log('Server error response:', errorData);
            throw new Error(errorData.error || 'Registration failed');
        }

        const data = await response.json();
        console.log('Registration response:', data);

        authStore.setEmployee({
            id: data.employee.id,
            firstName: data.employee.firstName,
            lastName: data.employee.lastName,
            username: data.employee.username,
            email: data.employee.email,
            employeeIdNumber: data.employee.employeeIdNumber,
            birthday: null,
            hireDate: null,
            contactInfo: newRequest.value.contactInfo,
            civilStatus: newRequest.value.civilStatus,
            position: data.employee.position,
            sss: newRequest.value.sss,
            philHealth: newRequest.value.philhealth,
            hdmf: newRequest.value.hdmf,
            role: data.employee.role,
            salary: newRequest.value.salary
        });
        authStore.setAccessToken(data.token);

        await authStore.fetchEmployeeDetails(data.employee.id);
        console.log('Registration successful, employee details fetched');
        closeModal();
    } catch (error) {
        console.error('Error during registration:', error);
        alert(`Registration failed: ${error.message}`);
    }
};
</script>

<template>
    <div class="text-center">
        <p class="text-sm text-gray-700">
            Don't have an account?
            <a href="#" @click="showRegisterModal = true" class="text-blue-500 hover:underline">
                Request an account
            </a>
        </p>
    </div>

    <Modal :show="showRegisterModal" @close="closeModal">
        <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 class="text-2xl font-bold mb-6 text-gray-900">Request Account Creation</h2>
            <form @submit.prevent="submitRequest" class="grid grid-cols-2 gap-6">
                <div class="col-span-2">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="firstName" class="text-sm font-medium text-gray-700">First Name</label>
                            <input v-model="newRequest.firstName" type="text" id="firstName"
                                class="block w-full p-2 border rounded-lg" placeholder="Enter your first name" required>
                        </div>
                        <div class="space-y-1">
                            <label for="lastName" class="text-sm font-medium text-gray-700">Last Name</label>
                            <input v-model="newRequest.lastName" type="text" id="lastName"
                                class="block w-full p-2 border rounded-lg" placeholder="Enter your last name" required>
                        </div>
                        <div class="space-y-1">
                            <label for="email" class="text-sm font-medium text-gray-700">Email</label>
                            <input v-model="newRequest.email" type="email" id="email"
                                class="block w-full p-2 border rounded-lg" placeholder="Enter your email" required>
                        </div>
                        <div class="space-y-1">
                            <label for="contactInfo" class="text-sm font-medium text-gray-700">Contact Number</label>
                            <input v-model="newRequest.contactInfo" type="text" id="contactInfo"
                                class="block w-full p-2 border rounded-lg" placeholder="Enter your contact number"
                                required>
                        </div>
                        <div class="space-y-1">
                            <label for="position" class="text-sm font-medium text-gray-700">Position Applying
                                For</label>
                            <select v-model="newRequest.position" id="position"
                                class="block w-full p-2 border rounded-lg" required>
                                <option v-for="position in positions" :key="position" :value="position">{{ position }}
                                </option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label for="civilStatus" class="text-sm font-medium text-gray-700">Civil Status</label>
                            <select v-model="newRequest.civilStatus" id="civilStatus"
                                class="block w-full p-2 border rounded-lg" required>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="col-span-2">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Financial Information</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="salary" class="text-sm font-medium text-gray-700">Proposed Salary</label>
                            <input v-model.number="newRequest.salary" type="number" id="salary"
                                class="block w-full p-2 border rounded-lg" placeholder="Enter proposed salary" required>
                        </div>
                        <div class="space-y-1">
                            <label for="sss" class="text-sm font-medium text-gray-700">SSS Number</label>
                            <input v-model="newRequest.sss" type="text" id="sss"
                                class="block w-full p-2 border rounded-lg" placeholder="Enter your SSS number">
                        </div>
                        <div class="space-y-1">
                            <label for="philhealth" class="text-sm font-medium text-gray-700">PhilHealth Number</label>
                            <input v-model="newRequest.philhealth" type="text" id="philhealth"
                                class="block w-full p-2 border rounded-lg" placeholder="Enter your PhilHealth number">
                        </div>
                        <div class="space-y-1">
                            <label for="hdmf" class="text-sm font-medium text-gray-700">Pag-IBIG Number</label>
                            <input v-model="newRequest.hdmf" type="text" id="hdmf"
                                class="block w-full p-2 border rounded-lg" placeholder="Enter your Pag-IBIG number">
                        </div>
                    </div>
                </div>

                <div class="col-span-2">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Login Credentials</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="username" class="text-sm font-medium text-gray-700">Username</label>
                            <input v-model="newRequest.username" type="text" id="username"
                                class="block w-full p-2 border rounded-lg" placeholder="Choose a username" required>
                        </div>
                        <div class="space-y-1">
                            <label for="password" class="text-sm font-medium text-gray-700">Password</label>
                            <input v-model="newRequest.password" type="password" id="password"
                                class="block w-full p-2 border rounded-lg" placeholder="Choose a password" required>
                        </div>
                    </div>
                </div>

                <div class="col-span-2 flex justify-end space-x-2 mt-6">
                    <button type="button" @click="closeModal"
                        class="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-200">
                        Cancel
                    </button>
                    <button type="submit"
                        class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200">
                        Submit Request
                    </button>
                </div>
            </form>
        </div>
    </Modal>
</template>