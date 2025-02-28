import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Employee {
id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  employeeIdNumber: string;
  birthday: Date | null;
  hireDate: Date | null;
  contactInfo: string | null;
  civilStatus: string | null;
  position: string | null;
  sss: string | null;
  philHealth: string | null;
  hdmf: string | null;
  role: string;
  salary?: number;
}

export const useAuthStore = defineStore('auth', () => {
    // Initialize with null as default if no user exists in localStorage
    const employee = ref<Employee | null>(JSON.parse(localStorage.getItem('employee') || 'null'));
    const accessToken = ref<string | null>(localStorage.getItem('token') || null);

    function saveEmployee() {
        if (employee.value) {
        localStorage.setItem('employee', JSON.stringify(employee.value));
        }
    }

    function saveAccessToken() {
        if (accessToken.value) {
            localStorage.setItem('token', accessToken.value);
        } else {
            localStorage.removeItem('token');
        }
    }

    function setEmployee(newEmployee: Employee | null): void {
        employee.value = newEmployee;
        saveEmployee();
    }

    function setAccessToken(newToken: string | null): void {
        console.log(`access token ${newToken}`);
        accessToken.value = newToken;
        saveAccessToken();
    }

    // Optional: Add a logout function
    function logout(): void {
        employee.value = null;
        accessToken.value = null;
        localStorage.removeItem('employee');
        localStorage.removeItem('token');
    }

    return { employee, accessToken, setEmployee, setAccessToken, logout }
});