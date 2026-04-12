import { writable } from "svelte/store";
import type { Folder, File } from "./types.ts";



export const openFolderIds = writable<Folder["id"][]>([]);
export const openFileIds = writable<File["id"][]>([]);
