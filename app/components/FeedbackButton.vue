<script lang="ts" setup>
const { t } = useI18n();
const toast = useToast();

function showNotImplemented() {
    toast.add({ title: t("feedback.notImplemented"), color: "info" });
}
</script>

<template>
    <UButton
        color="secondary"
        icon="i-lucide-message-square"
        :label="t('feedback.button')"
        @click="showNotImplemented"
    />
</template>
