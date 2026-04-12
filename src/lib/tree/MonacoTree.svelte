<script lang="ts" module>
	import type { Snippet } from "svelte";

    export interface Props {
        treeName: string;
        nameStripeButtons?: {
            newFile: boolean;
            newFolder: boolean;
            newProject: boolean;
            refresh: boolean;
        };
        oneFileSelected?: boolean;
        clickToUnselectFile?: boolean;
        /** Whether icons will be shown in treeview */
        showIcons?: boolean;
        projects: Project[];
        /**
         * Use to: open / close the entry e.g: for folder is such
         * @param entry - it's already updated state
         */
        onToggleEntry: (entry: File | Folder) => void | Promise<void>;
        onToggleProject: (project: Project) => void | Promise<void>;
        onNewFile: () => Promise<void> | void;
        onNewFolder: () => Promise<void> | void;
        onNewProject: () => Promise<void> | void;
        onRefreshTreeView: () => Promise<void> | void;
        version?: "mobile" | "desktop";
        noProjectContainer?: Snippet;
    }
</script>

<script lang="ts">
	import Entry from "./Entry.svelte";

    import Icon from "./IconifyOffline.svelte"
	import { openProjectIds, openProjects } from "./store.ts";
    import type { File, Folder, Project } from "./types.ts";

    let {
        treeName,
        nameStripeButtons = {
            newFile: true,
            newFolder: true,
            newProject: true,
            refresh: true
        },
        oneFileSelected = true,
        clickToUnselectFile = true,
        projects = $bindable([]),
        showIcons = true,
        version = "desktop",
        onToggleEntry,
        onToggleProject,
        noProjectContainer
    }: Props = $props();

    // Assign the projects
    $effect(() => {
        projects;
        $openProjects = projects;
    });

    type ButtonName = keyof NonNullable<Props["nameStripeButtons"]>

    const buttonIcons: Record<ButtonName, string> = {
        newFile: "material-symbols:note-add-outline-rounded",
        newFolder: "material-symbols:create-new-folder-outline-rounded",
        newProject: "material-symbols:folder-code-outline-rounded",
        refresh: "material-symbols:refresh-rounded"
    }

    function onToggleProjectHandle(project: Project, isProjectOpen: boolean) {
        return () => {
            if (isProjectOpen) {
                const listId = $openProjectIds.findIndex(projectid => projectid === project.id);

                if (listId > -1) {
                    $openProjectIds.splice(listId, 1);
                }

                // Opened project ID
                $openProjectIds = $openProjectIds;
            }
            else $openProjectIds = [...$openProjectIds, project.id];

            // Handle external user passed function
            onToggleProject(project);
        }
    }

    function sortEntries(entries: Array<File | Folder>) {
        return [...entries].sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === "folder" ? -1 : 1;
            }

            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        });
    }

    function onProjectContextMenu() {

    }
</script>

<div
    class="flex flex-col gap-2 w-full h-full p-4"
>
    <div 
        id="tree-view-heading"
        class="flex gap-2 items-center justify-between select-none"
    >
        <h3 class="font-bold">{treeName}</h3>

        <div id="buttons" class="flex items-center gap-1">
            {#each (Object.entries(nameStripeButtons) as [ButtonName, boolean][]) as [key, isOn]}
                {#if isOn}
                    <button
                        type="button"
                        class="btn p-1 px-2 btn-ghost inline-flex"
                    >
                        <Icon icon={buttonIcons[key]}/>
                    </button>
                {/if}
            {/each}
        </div>
    </div>

    <div class="h-full overflow-y-auto overflow-x-auto">
        {#if $openProjects.length}
            {#each $openProjects as project (project.id)}
                {@const isProjectOpen = $openProjectIds.includes(project.id)}
                {@const sortedEntries = sortEntries(project.entries)}
            
                <div class="w-full">
                    <button 
                        class="w-full flex gap-4 justify-between items-center cursor-poiner hover:bg-white/5 p-1 rounded-lg"
                        onclick={onToggleProjectHandle(project, isProjectOpen)}
                        oncontextmenu={onProjectContextMenu}
                    >
                        <div
                            class="flex gap-2 items-center"
                        >
                            <Icon icon="material-symbols:code-blocks-outline-rounded"/>
                            <span class="font-semibold">{project.name}</span>
                        </div>

                        <div class="btn btn-ghost btn-xs">
                            <Icon icon={!isProjectOpen ? "material-symbols:keyboard-arrow-up-rounded" : "material-symbols:keyboard-arrow-down-rounded"}/>
                        </div>
                    </button>

                    <div
                        class="pl-4"
                    >
                        {#if isProjectOpen}
                            {#each sortedEntries as entry}
                                <Entry
                                    {clickToUnselectFile}
                                    {oneFileSelected}
                                    {entry}
                                    {onToggleEntry}
                                />
                            {/each}
                        {/if}
                    </div>
                </div>
            {/each}
        {:else}
            <div
                class="flex w-full h-full items-center justify-center select-none"
            >
                {#if noProjectContainer}
                    {@render noProjectContainer()}
                {:else}
                    <p class="text-sm text-base-content/70">No Projects Open</p>
                {/if}
            </div>
        {/if}
    </div>
</div>
