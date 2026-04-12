import { addCollection } from "@iconify/svelte";
import materialSymbols from "@iconify-json/material-symbols/icons.json";
import simpleIcons from "@iconify-json/simple-icons/icons.json";
import mdiIcons from "@iconify-json/mdi/icons.json";
import deviconIcons from "@iconify-json/devicon/icons.json";

const OFFLINE_ICONIFY_READY_KEY = "__ravencode_iconify_offline_ready__";

const state = globalThis as typeof globalThis & {
    [OFFLINE_ICONIFY_READY_KEY]?: boolean;
};

if (!state[OFFLINE_ICONIFY_READY_KEY]) {
    addCollection(materialSymbols);
    addCollection(simpleIcons);
    addCollection(mdiIcons);
    addCollection(deviconIcons);
    state[OFFLINE_ICONIFY_READY_KEY] = true;
}
