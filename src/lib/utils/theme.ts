import { writable } from "svelte/store"
import type { Writable } from "svelte/store"

type Themes = "dark" | "light"
export const theme: Writable<Themes> = writable<Themes>("light")
