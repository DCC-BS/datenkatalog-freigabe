<template>
    <div class="flex flex-col min-h-dvh">
        <div class="border-b border-default">
            <NavigationBar
                :show-system-status="false"
                :show-language-select="false"
                :show-onboarding-restart="false"
            />
        </div>
        <main class="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
            <slot />
        </main>
        <div class="border-t border-default py-2">
            <DataBsFooter size="sm">
                <template #center>
                    <div />
                </template>
                <template #right>
                    <div class="flex justify-end">
                        <FeedbackButton />
                    </div>
                </template>
            </DataBsFooter>
        </div>
    </div>
</template>
