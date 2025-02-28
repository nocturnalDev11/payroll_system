<template>
    <div class="flex min-h-screen bg-gray-900 text-gray-200">
        <!-- Left side - Image -->
        <div class="hidden lg:flex lg:w-1/2 items-center justify-center bg-gray-100 border-r border-gray-700">
            <img src="@/assets/pic.png" alt="Payroll System" class="object-cover w-3/4 h-3/4">
        </div>

        <!-- Right side - Login Options -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div class="max-w-md w-full">
                <div class="text-center mb-12">
                    <h1 class="text-3xl font-semibold mb-2 text-gray-100">Payroll System</h1>
                    <p class="text-gray-400">Select your login type</p>
                </div>

                <div class="space-y-4">
                    <router-link :to="{ name: 'admin-login' }"
                        class="block w-full bg-gray-800 border border-gray-700 text-gray-300 text-center py-3 rounded-lg font-medium hover:bg-gray-700 transition duration-300">
                        Admin Login
                    </router-link>

                    <router-link :to="{ name: 'employee-login' }"
                        class="block w-full bg-gray-800 border border-gray-700 text-gray-300 text-center py-3 rounded-lg font-medium hover:bg-gray-700 transition duration-300">
                        Employee Login
                    </router-link>
                </div>

                <div class="mt-8 text-center text-xs text-gray-500">
                    <p>© 2025 Payroll System. All rights reserved.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LoginSelection',
};
</script>

<style scoped></style>
