<script lang="ts" setup>
import type { DataOwner, Dataset, Person } from "#shared/dataspot";
import type { SelectableAsset } from "~/types/selectableAsset";

type SelectionMode = "datasets" | "collections";

const { t } = useI18n();
const runtimeConfig = useRuntimeConfig();
const toast = useToast();
const { data: authData } = useAppAuth();

const senderGivenName = computed(() => {
    const name = (authData.value?.user.name ?? "").trim();
    const separatorIndex = name.indexOf(",");
    if (separatorIndex === -1) return name;
    return name.slice(separatorIndex + 1).trim();
});

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

watch(personItems, (items) => {
    if (items.length === 1) selectedPersonItem.value = items[0];
});

const selectedPerson = computed(() => selectedPersonItem.value?.person);

const datasets = ref<Dataset[]>([]);
const datasetsLoading = ref(false);
let latestRequestId = 0;

watch(selectedPerson, async (person) => {
    datasets.value = [];
    if (!person) return;

    const requestId = ++latestRequestId;
    datasetsLoading.value = true;
    try {
        const result = await $fetch<Dataset[]>("/api/datasets", {
            query: { personId: person.id },
        });
        if (requestId === latestRequestId) datasets.value = result;
    } catch (error) {
        if (requestId === latestRequestId) showError(error);
    } finally {
        if (requestId === latestRequestId) datasetsLoading.value = false;
    }
});

const postItems = computed(() => {
    const posts = new Map<string, string>();
    for (const dataset of datasets.value) {
        posts.set(dataset.postId, dataset.postLabel);
    }
    return [...posts]
        .map(([id, label]) => ({ label, id }))
        .sort((a, b) => a.label.localeCompare(b.label));
});

const selectedPostItem = ref<(typeof postItems.value)[number]>();

watch(postItems, (items) => {
    selectedPostItem.value = items[0];
});

const postDatasets = computed(() =>
    datasets.value.filter(
        (dataset) => dataset.postId === selectedPostItem.value?.id,
    ),
);

const mode = ref<SelectionMode>("datasets");
const modeItems = computed(() => [
    { label: t("selection.datasets"), value: "datasets" },
    { label: t("selection.collections"), value: "collections" },
]);

const selectableItems = computed<SelectableAsset[]>(() => {
    if (mode.value === "datasets") {
        return postDatasets.value
            .map((dataset) => ({
                id: dataset.datasetId,
                label: dataset.datasetLabel,
                description: dataset.collectionLabel,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    const collections = new Map<string, { label: string; count: number }>();
    for (const dataset of postDatasets.value) {
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
    return [...collections]
        .map(([id, collection]) => ({
            id,
            label: collection.label,
            description: t("selection.datasetCount", { count: collection.count }),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
});

const selectedIds = ref<string[]>([]);

watch(selectableItems, (items) => {
    selectedIds.value = items.map((item) => item.id);
});

const selectedAssets = computed(() =>
    selectableItems.value.filter((item) => selectedIds.value.includes(item.id)),
);

const selectedDataOwners = computed<DataOwner[]>(() => {
    const selectedDatasets = postDatasets.value.filter((dataset) =>
        selectedIds.value.includes(
            mode.value === "datasets"
                ? dataset.datasetId
                : dataset.collectionId,
        ),
    );
    const owners = new Map<string, DataOwner>();
    for (const dataset of selectedDatasets) {
        for (const owner of dataset.dataOwners) {
            owners.set(`${owner.givenName} ${owner.familyName}`, owner);
        }
    }
    return [...owners.values()].sort(
        (a, b) =>
            a.familyName.localeCompare(b.familyName) ||
            a.givenName.localeCompare(b.givenName),
    );
});

const subject = ref("");
const body = ref("");

watch(
    [selectedPerson, mode, selectedAssets, selectedDataOwners, senderGivenName],
    () => {
        if (!selectedPerson.value) return;
        const email = buildReviewRequestEmail(
            selectedPerson.value.givenName,
            selectedPerson.value.gender,
            senderGivenName.value,
            mode.value,
            selectedAssets.value,
            runtimeConfig.public.weisungSchutzmassnahmenUrl,
            selectedDataOwners.value,
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
                <UFormField :label="t('post.label')">
                    <USelectMenu
                        v-model="selectedPostItem"
                        :items="postItems"
                        :placeholder="t('post.placeholder')"
                        :search-input="{ placeholder: t('steward.searchPlaceholder') }"
                        class="w-full"
                    />
                </UFormField>

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

                <USeparator />

                <FreigabePdfBlock
                    :family-name="selectedPerson.familyName"
                    :asset-type="mode"
                    :assets="selectedAssets"
                />
            </template>
        </template>
    </div>
</template>
