<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6">
        <div class="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col lg:flex-row">
            <!-- Left side - Content -->
            <div class="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12 space-y-6 sm:space-y-8">
                <div>
                    <h1 class="text-3xl sm:text-4xl font-light text-gray-800 mb-2">Welcome</h1>
                    <p class="text-sm sm:text-base text-gray-500">Please select your login type</p>
                </div>


                <div class="space-y-3 sm:space-y-4">
                    <router-link :to="{ name: 'admin-login' }" class="group block">
                        <div
                            class="p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-blue-500 transition-all duration-300 hover:shadow-md">
                            <h2 class="text-base sm:text-lg font-medium text-gray-700 group-hover:text-blue-500">Admin
                                Portal</h2>
                            <p class="text-xs sm:text-sm text-gray-500 mt-1">Access administrative controls and
                                management</p>
                        </div>
                    </router-link>

                    <router-link :to="{ name: 'employee-login' }" class="group block">
                        <div
                            class="p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-blue-500 transition-all duration-300 hover:shadow-md">
                            <h2 class="text-base sm:text-lg font-medium text-gray-700 group-hover:text-blue-500">
                                Employee Portal</h2>
                            <p class="text-xs sm:text-sm text-gray-500 mt-1">View your payroll and personal information
                            </p>
                        </div>
                    </router-link>
                </div>

                <div class="pt-6 sm:pt-8 text-center">
                    <p class="text-xs sm:text-sm text-gray-400">&copy; 2025 Payroll System</p>
                </div>
            </div>

            <!-- Right side - Illustration -->
            <div class="hidden lg:block lg:w-1/2 bg-gray-50 p-6 sm:p-8 lg:p-12">
                <img src="@/assets/pic1.png" alt="Payroll System" class="w-full h-full object-contain">
            </div>
        </div>
    </div>
</template>
