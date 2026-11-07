<script lang="ts" setup>
const props = defineProps<{
    recipient: string;
    disabled: boolean;
}>();

const subject = defineModel<string>("subject", { required: true });
const body = defineModel<string>("body", { required: true });

const { t } = useI18n();
const toast = useToast();

async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    toast.add({ title: t("email.copied"), color: "success" });
}

function openMailProgram() {
    window.location.href = buildMailtoLink(
        props.recipient,
        subject.value,
        body.value,
    );
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <UFormField :label="t('email.recipient')">
            <UInput :model-value="props.recipient" readonly class="w-full" />
        </UFormField>
        <UFormField :label="t('email.subject')">
            <UInput v-model="subject" class="w-full" />
        </UFormField>
        <UFormField :label="t('email.body')" :help="t('email.editHint')">
            <UTextarea v-model="body" autoresize :rows="12" class="w-full" />
        </UFormField>
        <div class="flex flex-wrap items-center gap-2">
            <UButton
                icon="i-lucide-copy"
                variant="outline"
                :label="t('email.copySubject')"
                :disabled="props.disabled"
                @click="copyToClipboard(subject)"
            />
            <UButton
                icon="i-lucide-copy"
                variant="outline"
                :label="t('email.copyBody')"
                :disabled="props.disabled"
                @click="copyToClipboard(body)"
            />
            <UButton
                icon="i-lucide-mail"
                :label="t('email.openMail')"
                :disabled="props.disabled"
                @click="openMailProgram"
            />
        </div>
        <p class="text-sm text-muted">{{ t("email.mailtoHint") }}</p>
    </div>
</template>
