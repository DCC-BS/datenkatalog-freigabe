<script lang="ts" setup>
import type { SelectableAsset } from "~/types/selectableAsset";

const props = defineProps<{
    items: SelectableAsset[];
}>();

const selectedIds = defineModel<string[]>({ required: true });

const { t } = useI18n();

const checkboxItems = computed(() =>
    props.items.map((item) => ({
        label: item.label,
        description: item.description,
        value: item.id,
    })),
);

function selectAll() {
    selectedIds.value = props.items.map((item) => item.id);
}

function selectNone() {
    selectedIds.value = [];
}
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex gap-2">
            <UButton
                size="xs"
                variant="outline"
                :label="t('selection.selectAll')"
                @click="selectAll"
            />
            <UButton
                size="xs"
                variant="outline"
                :label="t('selection.selectNone')"
                @click="selectNone"
            />
        </div>
        <UCheckboxGroup v-model="selectedIds" :items="checkboxItems" />
    </div>
</template>
