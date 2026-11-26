<script lang="ts" setup>
import type { DropdownMenuItem } from "@nuxt/ui";

const { t } = useI18n();
const { signOut } = useAppAuth();

const settingsItems = computed<DropdownMenuItem[]>(() => [
    {
        label: t("navigation.signOut"),
        icon: "i-lucide-log-out",
        onSelect: signOut,
    },
]);
</script>

<template>
    <div class="flex flex-col h-dvh overflow-hidden">
        <div class="shrink-0 border-b border-default">
            <NavigationBar
                :show-system-status="false"
                :show-language-select="false"
                :show-onboarding-restart="false"
            >
                <template #rightPostItems>
                    <SettingsButton
                        :items="settingsItems"
                        :trigger-label="t('navigation.settings')"
                    />
                </template>
            </NavigationBar>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <main class="w-full max-w-5xl mx-auto px-4 py-6">
                <slot />
            </main>
        </div>
        <div class="shrink-0 border-t border-default py-2 bg-default">
            <DataBsFooter size="sm">
                <template #center>
                    <div />
                </template>
                <template #right>
                    <div class="flex justify-end">
                        <FeedbackControl :inline="true" />
                    </div>
                </template>
            </DataBsFooter>
        </div>
    </div>
</template>
