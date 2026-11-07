<script lang="ts" setup>
import type { Person, WorkingDataset } from "#shared/dataspot";
import type { SelectableAsset } from "~/types/selectableAsset";

type SelectionMode = "datasets" | "collections";

const { t } = useI18n();
const toast = useToast();

function showError(error: unknown) {
    const data = (error as { data?: { data?: { code?: string } } }).data;
    const code = data?.data?.code ?? "UNKNOWN";
    toast.add({
        title: t("errors.occurred"),
        description: t("errors.code", { code }),
        color: "error",
    });
}

const {
    data: persons,
    pending: personsPending,
    error: personsError,
} = useLazyFetch<Person[]>("/api/persons", { server: false, default: () => [] });

watch(personsError, (error) => {
    if (error) showError(error);
});

const personItems = computed(() =>
    persons.value.map((person) => ({
        label: `${person.familyName} ${person.givenName} (${person.email})`,
        person,
    })),
);

const selectedPersonItem = ref<(typeof personItems.value)[number]>();
const selectedPerson = computed(() => selectedPersonItem.value?.person);

const datasets = ref<WorkingDataset[]>([]);
const datasetsLoading = ref(false);
let latestRequestId = 0;

watch(selectedPerson, async (person) => {
    datasets.value = [];
    if (!person) return;

    const requestId = ++latestRequestId;
    datasetsLoading.value = true;
    try {
        const result = await $fetch<WorkingDataset[]>("/api/working-datasets", {
            query: { personId: person.id },
        });
        if (requestId === latestRequestId) datasets.value = result;
    } catch (error) {
        if (requestId === latestRequestId) showError(error);
    } finally {
        if (requestId === latestRequestId) datasetsLoading.value = false;
    }
});

const mode = ref<SelectionMode>("datasets");
const modeItems = computed(() => [
    { label: t("selection.datasets"), value: "datasets" },
    { label: t("selection.collections"), value: "collections" },
]);

const selectableItems = computed<SelectableAsset[]>(() => {
    if (mode.value === "datasets") {
        return datasets.value.map((dataset) => ({
            id: dataset.datasetId,
            label: dataset.datasetLabel,
            description: dataset.collectionLabel,
        }));
    }

    const collections = new Map<string, { label: string; count: number }>();
    for (const dataset of datasets.value) {
        const collection = collections.get(dataset.collectionId);
        if (collection) {
            collection.count += 1;
        } else {
            collections.set(dataset.collectionId, {
                label: dataset.collectionLabel,
                count: 1,
            });
        }
    }
    return [...collections].map(([id, collection]) => ({
        id,
        label: collection.label,
        description: t("selection.datasetCount", { count: collection.count }),
    }));
});

const selectedIds = ref<string[]>([]);

watch(selectableItems, (items) => {
    selectedIds.value = items.map((item) => item.id);
});

const selectedAssets = computed(() =>
    selectableItems.value.filter((item) => selectedIds.value.includes(item.id)),
);

const subject = ref("");
const body = ref("");

watch(
    [selectedPerson, mode, selectedAssets],
    () => {
        if (!selectedPerson.value) return;
        const email = buildReviewRequestEmail(
            selectedPerson.value.givenName,
            mode.value,
            selectedAssets.value,
        );
        subject.value = email.subject;
        body.value = email.body;
    },
    { immediate: true },
);
</script>

<template>
    <div class="flex flex-col gap-6">
        <div>
            <h1 class="text-2xl font-bold">{{ t("page.title") }}</h1>
            <p class="text-muted">{{ t("page.intro") }}</p>
        </div>

        <UFormField :label="t('steward.label')">
            <ClientOnly>
                <USelectMenu
                    v-model="selectedPersonItem"
                    :items="personItems"
                    :loading="personsPending"
                    :disabled="personsPending"
                    :placeholder="
                        personsPending
                            ? t('steward.loading')
                            : t('steward.placeholder')
                    "
                    :search-input="{ placeholder: t('steward.searchPlaceholder') }"
                    class="w-full"
                />
            </ClientOnly>
        </UFormField>

        <template v-if="selectedPerson">
            <div
                v-if="datasetsLoading"
                class="flex items-center gap-2 text-muted"
            >
                <UIcon name="i-lucide-loader-circle" class="animate-spin" />
                {{ t("steward.loadingDatasets") }}
            </div>

            <UAlert
                v-else-if="datasets.length === 0"
                color="neutral"
                variant="subtle"
                :title="t('steward.noDatasets')"
            />

            <template v-else>
                <UFormField :label="t('selection.label')">
                    <URadioGroup
                        v-model="mode"
                        :items="modeItems"
                        orientation="horizontal"
                        class="mb-3"
                    />
                    <AssetSelection v-model="selectedIds" :items="selectableItems" />
                </UFormField>

                <USeparator />

                <EmailPreview
                    v-model:subject="subject"
                    v-model:body="body"
                    :recipient="selectedPerson.email"
                    :disabled="selectedAssets.length === 0"
                />
            </template>
        </template>
    </div>
</template>
