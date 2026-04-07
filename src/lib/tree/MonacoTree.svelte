<script lang="ts">
	import type { File, Folder, Project } from "./types.ts";

    let {
        projects,
        showIcons = true,
        version = "desktop",
        onToggleEntry,
        onToggleProject
    }: {
        /** Whether icons will be shown in treeview */
        showIcons?: boolean;
        projects: Project[];
        /**
         * Use to: open / close the entry e.g: for folder is such
         * @param entry - it's already updated state
         */
        onToggleEntry: (entry: File | Folder) => void | Promise<void>;
        onToggleProject: (project: Project) => void | Promise<void>;
        version?: "mobile" | "desktop";
    } = $props();
</script>


