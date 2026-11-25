<script lang="ts" setup>
import type { SelectableAsset } from "~/types/selectableAsset";

const props = defineProps<{
    items: SelectableAsset[];
}>();

const selectedIds = defineModel<string[]>({ required: true });

const { t } = useI18n();

const searchQuery = ref("");

const filteredItems = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return props.items;
    return props.items.filter((item) => {
        const label = item.label.toLowerCase();
        const description = (item.description ?? "").toLowerCase();
        return label.includes(query) || description.includes(query);
    });
});

const checkboxItems = computed(() =>
    filteredItems.value.map((item) => ({
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
        <div class="flex flex-wrap items-center justify-between gap-2">
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
            <p class="text-sm text-muted">
                {{
                    t("selection.selectedCount", {
                        selected: selectedIds.length,
                        total: items.length,
                    })
                }}
            </p>
        </div>
        <UInput
            v-model="searchQuery"
            :placeholder="t('selection.searchPlaceholder')"
            icon="i-lucide-search"
            class="w-full"
        />
        <div class="max-h-80 overflow-y-auto">
            <UCheckboxGroup v-model="selectedIds" :items="checkboxItems" />
        </div>
    </div>
</template>
