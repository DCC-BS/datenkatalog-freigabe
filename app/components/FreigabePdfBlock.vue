<script lang="ts" setup>
import { type CatalogAssetType, catalogUrl } from "#shared/dataspot";
import type { EmailAsset } from "~/utils/reviewRequestEmail";

const props = defineProps<{
    familyName: string;
    assetType: CatalogAssetType;
    assets: EmailAsset[];
}>();

const { t } = useI18n();
const toast = useToast();

const text = FREIGABE_PDF_TEXT;
const page = useTemplateRef<HTMLElement>("page");
const generating = ref(false);

async function downloadPdf() {
    if (!page.value) return;
    generating.value = true;
    // html2canvas measures the text baseline with a 1x1 inline image in the live document;
    // Tailwind's `img { display: block }` breaks that measurement and shifts all text down.
    const baselineFix = document.createElement("style");
    baselineFix.textContent =
        'body > div > img[width="1"][height="1"] { display: inline !important; }';
    document.head.appendChild(baselineFix);
    try {
        const { default: html2pdf } = await import("html2pdf.js");
        await html2pdf()
            .set({
                margin: 0,
                filename: buildFreigabePdfFilename(props.familyName),
                image: { type: "png" },
                html2canvas: {
                    scale: 3,
                    // html2canvas cannot parse the oklch colors inherited from the Nuxt UI theme.
                    onclone: (clonedDocument: Document) => {
                        clonedDocument.documentElement.style.color = "#000000";
                        clonedDocument.body.style.color = "#000000";
                    },
                },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            })
            .from(page.value)
            .save();
    } catch {
        toast.add({ title: t("pdf.failed"), color: "error" });
    } finally {
        baselineFix.remove();
        generating.value = false;
    }
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <div>
            <h2 class="text-lg font-semibold">{{ t("pdf.label") }}</h2>
            <p class="text-sm text-muted">{{ t("pdf.hint") }}</p>
        </div>

        <div class="overflow-x-auto rounded-md bg-elevated p-4">
            <div class="sheet mx-auto">
                <div ref="page" class="freigabe-page">
                    <img
                        src="/freigabe/baselstab.png"
                        alt=""
                        class="baselstab"
                    />
                    <img
                        src="/freigabe/data-bs-banner.svg"
                        alt=""
                        class="banner"
                    />
                    <div class="letterhead">
                        <p>{{ text.department }}</p>
                        <p class="unit">{{ text.unit }}</p>
                    </div>

                    <h1 class="title">
                        <template v-for="line in text.titleLines" :key="line">
                            {{ line }}<br />
                        </template>
                        <a :href="text.catalogUrl">{{ text.catalogUrl }}</a>
                    </h1>

                    <p class="heading">{{ text.heading }}</p>
                    <p>{{ text.intro }}</p>
                    <ul class="assets">
                        <li v-for="asset in props.assets" :key="asset.id">
                            <span class="bullet">•</span>
                            <a :href="catalogUrl(props.assetType, asset.id)">{{
                                asset.label
                            }}</a>
                        </li>
                    </ul>
                    <p>
                        {{ text.consentBeforePortal
                        }}<a :href="text.portalUrl">{{ text.portalUrl }}</a
                        >{{ text.consentAfterPortal }}
                    </p>

                    <p class="signature">{{ text.signature }}</p>
                </div>
            </div>
        </div>

        <div>
            <UButton
                icon="i-lucide-file-down"
                :label="t('pdf.download')"
                :loading="generating"
                :disabled="props.assets.length === 0"
                @click="downloadPdf"
            />
        </div>
    </div>
</template>

<style scoped>
.sheet {
    width: 210mm;
    min-height: 297mm;
    background: #ffffff;
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.15);
}

.freigabe-page {
    position: relative;
    width: 210mm;
    padding: 45.7mm 20mm 24.5mm 22mm;
    background: #ffffff;
    color: #000000;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
}

.freigabe-page,
.freigabe-page * {
    border-color: #000000;
    outline-color: #000000;
}

.freigabe-page p {
    margin: 0 0 11pt;
}

/* html2canvas draws text-decoration underlines on the baseline, so links are underlined with a border instead. */
.freigabe-page a {
    color: #000000;
    text-decoration: none;
    border-bottom: 1px solid #000000;
}

.baselstab {
    position: absolute;
    top: 0;
    left: 0;
    width: 210mm;
}

.banner {
    position: absolute;
    top: 7.2mm;
    left: 9.5mm;
    width: 177mm;
}

.letterhead {
    position: absolute;
    top: 12.5mm;
    left: 22mm;
    font-size: 8pt;
    line-height: 1.3;
}

.freigabe-page .letterhead p {
    margin: 0;
}

.freigabe-page .letterhead .unit {
    margin-top: 2.8mm;
    font-weight: bold;
}

.title {
    margin: 0 0 22pt;
    font-size: 15pt;
    font-weight: bold;
    line-height: 1.3;
}

.freigabe-page .heading {
    margin-bottom: 11pt;
    font-weight: bold;
}

/* html2canvas misplaces native list markers, so bullets are rendered as text. */
.assets {
    margin: 0 0 11pt;
    padding: 0;
    list-style: none;
}

.assets li {
    position: relative;
    padding-left: 7mm;
    break-inside: avoid;
    page-break-inside: avoid;
}

.assets .bullet {
    position: absolute;
    left: 2mm;
}

.freigabe-page .signature {
    margin: 30mm 0 0;
    padding-top: 2mm;
    border-top: 0.3mm solid #000000;
    break-inside: avoid;
    page-break-inside: avoid;
}
</style>
