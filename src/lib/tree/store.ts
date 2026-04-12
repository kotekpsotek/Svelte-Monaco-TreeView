import { writable } from "svelte/store";
import type { Folder, File, Project } from "./types.ts";

export const openProjects = writable<Project[]>([]);
export const openProjectIds = writable<Project["id"][]>([]);
export const openFolderIds = writable<Folder["id"][]>([]);
export const openFileIds = writable<File["id"][]>([]);
