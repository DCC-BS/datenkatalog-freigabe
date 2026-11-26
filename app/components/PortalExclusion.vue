<script lang="ts" setup>
import type { SelectableAsset } from "~/types/selectableAsset";

const props = defineProps<{
    items: SelectableAsset[];
}>();

const excludedIds = defineModel<string[]>({ required: true });

const { t } = useI18n();

const checkboxItems = computed(() =>
    props.items.map((item) => ({
        label: item.label,
        description: item.description,
        value: item.id,
    })),
);
</script>

<template>
    <UCollapsible class="flex flex-col gap-2">
        <UButton
            class="group justify-start"
            color="neutral"
            variant="ghost"
            trailing-icon="i-lucide-chevron-down"
            :label="
                t('selection.excludeFromPortal', {
                    count: excludedIds.length,
                })
            "
            :ui="{
                trailingIcon:
                    'group-data-[state=open]:rotate-180 transition-transform duration-200',
            }"
        />

        <template #content>
            <div class="flex flex-col gap-2 pt-1">
                <p class="text-sm text-muted">
                    {{ t("selection.excludeFromPortalHelp") }}
                </p>
                <UCheckboxGroup v-model="excludedIds" :items="checkboxItems" />
            </div>
        </template>
    </UCollapsible>
</template>
