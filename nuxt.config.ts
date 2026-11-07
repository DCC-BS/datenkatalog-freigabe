// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2024-11-01",
    devtools: { enabled: true },
    app: {
        head: {
            titleTemplate: "Datenkatalog Freigabe",
            htmlAttrs: {
                lang: "de",
            },
            meta: [
                { charset: "utf-8" },
                {
                    name: "viewport",
                    content: "width=device-width, initial-scale=1",
                },
            ],
        },
    },
    ui: {
        colorMode: false,
    },
    modules: ["@nuxt/ui", "@nuxtjs/i18n", "@dcc-bs/common-ui.bs.js"],
    typescript: {
        typeCheck: false,
        strict: true,
    },
    css: ["~/assets/css/main.css"],
    fonts: {
        providers: {
            bunny: false,
        },
    },
    i18n: {
        locales: [{ code: "de", name: "Deutsch", file: "de.json" }],
        defaultLocale: "de",
        strategy: "no_prefix",
        detectBrowserLanguage: false,
    },
});
