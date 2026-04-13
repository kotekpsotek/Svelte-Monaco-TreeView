import { writable } from "svelte/store";
import type { Folder, File, Project } from "./types.ts";

export const openProjects = writable<Project[]>([]);
export const openProjectIds = writable<Project["id"][]>([]);
export const openFolderIds = writable<Folder["id"][]>([]);
export const openFileIds = writable<File["id"][]>([]);

type ActiveContextMenu =
    | {
        kind: "project";
        x: number;
        y: number;
        projectId: Project["id"];
        project: Project;
    }
    | {
        kind: "file";
        x: number;
        y: number;
        projectId: Project["id"];
        file: File;
    }
    | {
        kind: "folder";
        x: number;
        y: number;
        projectId: Project["id"];
        folder: Folder;
    }
    | {
        kind: "empty-tray";
        x: number;
        y: number;
    }
    | null;
export const activeContextMenu = writable<ActiveContextMenu>(null);
