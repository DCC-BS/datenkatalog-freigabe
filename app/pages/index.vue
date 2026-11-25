<script lang="ts" setup>
import type { StepperItem } from "@nuxt/ui";
import type { DataOwner, Dataset, Person } from "#shared/dataspot";
import type { SelectableAsset } from "~/types/selectableAsset";

type SelectionMode = "datasets" | "collections";
type StepValue = "eingrenzen" | "auswahl" | "email" | "pdf";

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

const stepOrder: StepValue[] = ["eingrenzen", "auswahl", "email", "pdf"];

const step1Valid = computed(
    () =>
        !!selectedPerson.value &&
        !datasetsLoading.value &&
        datasets.value.length > 0 &&
        !!selectedPostItem.value,
);

const step2Valid = computed(() => selectedAssets.value.length > 0);

const activeStep = ref<StepValue>("eingrenzen");

const stepItems = computed<StepperItem[]>(() => [
    {
        value: "eingrenzen",
        title: t("steps.eingrenzen.title"),
        icon: "i-lucide-user",
    },
    {
        value: "auswahl",
        title: t("steps.auswahl.title"),
        icon: "i-lucide-list-checks",
        disabled: !step1Valid.value,
    },
    {
        value: "email",
        title: t("steps.email.title"),
        icon: "i-lucide-mail",
        disabled: !step1Valid.value || !step2Valid.value,
    },
    {
        value: "pdf",
        title: t("steps.pdf.title"),
        icon: "i-lucide-file-text",
        disabled: !step1Valid.value || !step2Valid.value,
    },
]);

const activeStepIndex = computed(() => stepOrder.indexOf(activeStep.value));

const canGoNext = computed(() => {
    if (activeStep.value === "eingrenzen") return step1Valid.value;
    if (activeStep.value === "auswahl") return step2Valid.value;
    return activeStepIndex.value < stepOrder.length - 1;
});

const hasPrev = computed(() => activeStepIndex.value > 0);
const hasNext = computed(() => activeStepIndex.value < stepOrder.length - 1);

function goPrev() {
    const previous = stepOrder[activeStepIndex.value - 1];
    if (previous) activeStep.value = previous;
}

function goNext() {
    if (!canGoNext.value) return;
    const next = stepOrder[activeStepIndex.value + 1];
    if (next) activeStep.value = next;
}

watch([step1Valid, step2Valid], () => {
    if (!step1Valid.value && activeStep.value !== "eingrenzen") {
        activeStep.value = "eingrenzen";
        return;
    }
    if (
        step1Valid.value &&
        !step2Valid.value &&
        (activeStep.value === "email" || activeStep.value === "pdf")
    ) {
        activeStep.value = "auswahl";
    }
});
</script>

<template>
    <div class="flex flex-col gap-4">
        <div>
            <h1 class="text-xl font-bold">{{ t("page.title") }}</h1>
            <p v-if="activeStep === 'eingrenzen'" class="mt-1 text-sm text-muted">
                {{ t("page.intro") }}
            </p>
        </div>

        <UStepper
            v-model="activeStep"
            :items="stepItems"
            size="sm"
            class="w-full"
        />

        <div v-show="activeStep === 'eingrenzen'" class="flex flex-col gap-4">
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
                        :search-input="{
                            placeholder: t('steward.searchPlaceholder'),
                        }"
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

                <UFormField v-else :label="t('post.label')">
                    <USelectMenu
                        v-model="selectedPostItem"
                        :items="postItems"
                        :placeholder="t('post.placeholder')"
                        :search-input="{
                            placeholder: t('steward.searchPlaceholder'),
                        }"
                        class="w-full"
                    />
                </UFormField>
            </template>
        </div>

        <div v-show="activeStep === 'auswahl'" class="flex flex-col gap-4">
            <UFormField :label="t('selection.label')">
                <URadioGroup
                    v-model="mode"
                    :items="modeItems"
                    orientation="horizontal"
                    class="mb-3"
                />
                <AssetSelection v-model="selectedIds" :items="selectableItems" />
            </UFormField>
        </div>

        <div v-show="activeStep === 'email'" class="flex flex-col gap-4">
            <EmailPreview
                v-if="selectedPerson"
                v-model:subject="subject"
                v-model:body="body"
                :recipient="selectedPerson.email"
                :disabled="selectedAssets.length === 0"
            />
        </div>

        <!-- Keep FreigabePdfBlock mounted via v-show so html2pdf keeps a live preview node. -->
        <div v-show="activeStep === 'pdf'" class="flex flex-col gap-4">
            <FreigabePdfBlock
                v-if="selectedPerson"
                :family-name="selectedPerson.familyName"
                :asset-type="mode"
                :assets="selectedAssets"
            />
        </div>

        <div class="flex justify-between gap-2">
            <UButton
                leading-icon="i-lucide-arrow-left"
                variant="outline"
                :label="t('steps.prev')"
                :disabled="!hasPrev"
                @click="goPrev"
            />
            <UButton
                v-if="hasNext"
                trailing-icon="i-lucide-arrow-right"
                :label="t('steps.next')"
                :disabled="!canGoNext"
                @click="goNext"
            />
        </div>
    </div>
</template>
