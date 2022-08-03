import { defineConfig } from "vite";
import Icons from "unplugin-icons/vite";
import Unocss from "unocss/vite";
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
    plugins: [sveltekit(), Icons({ compiler: "svelte" }), Unocss()],
});
