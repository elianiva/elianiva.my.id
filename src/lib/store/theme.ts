import { writable } from "svelte/store";

export enum Theme {
	// TODO(elianiva): not sure why eslint complains that these
	// lines aren't being used when in fact they are used
	// eslint-disable-next-line no-unused-vars
	DARK = "dark",
	// eslint-disable-next-line no-unused-vars
	LIGHT = "light",
}

export const theme = writable<Theme>(Theme.LIGHT);
