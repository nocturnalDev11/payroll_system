<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps({
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    duration: { type: Number, default: 3000 },
});

const emit = defineEmits(['close']);

const isVisible = ref(false);

onMounted(() => {
    isVisible.value = true;
    setTimeout(() => {
        isVisible.value = false;
        setTimeout(() => emit('close'), 300);
    }, props.duration);
});

onUnmounted(() => {
  isVisible.value = false;
});

const toastClasses = computed(() => ({
    'bg-green-500': props.type === 'success',
    'bg-red-500': props.type === 'error',
    'bg-yellow-500': props.type === 'warning',
    'bg-blue-500': props.type === 'info',
    'translate-y-0 opacity-100': isVisible.value,
    '-translate-y-full opacity-0': !isVisible.value,
}));
</script>

<template>
    <div v-if="message" :class="['toast', toastClasses]"
        class="fixed top-4 left-1/2 transform -translate-x-1/2 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300">
        {{ message }}
    </div>
</template>

<style scoped>
.toast {
    z-index: 1000;
}
</style>