<script lang="ts" module>
    export interface Props {
        treeName: string;
        nameStripeButtons?: {
            newFile: boolean;
            newFolder: boolean;
            newProject: boolean;
            refresh: boolean;
        };
        oneFileSelected?: boolean;
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
    }
</script>

<script lang="ts">
	import Entry from "./Entry.svelte";

    import Icon from "./IconifyOffline.svelte"
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
        projects = $bindable([]),
        showIcons = true,
        version = "desktop",
        onToggleEntry,
        onToggleProject
    }: Props = $props();

    type ButtonName = keyof NonNullable<Props["nameStripeButtons"]>

    const buttonIcons: Record<ButtonName, string> = {
        newFile: "material-symbols:note-add-outline-rounded",
        newFolder: "material-symbols:create-new-folder-outline-rounded",
        newProject: "material-symbols:folder-code-outline-rounded",
        refresh: "material-symbols:refresh-rounded"
    }

    function onToggleProjectHandle(project: Project) {
        return () => {
            projects = projects.map(projectLocal => projectLocal.id === project.id ? { ...projectLocal, isOpen: !projectLocal.isOpen } : projectLocal)
            onToggleProject(project);
        }
    }
</script>

<div
    class="flex flex-col gap-2 w-full h-full overflow-y-auto p-4"
>
    <div 
        id="tree-view-heading"
        class="flex gap-2 items-center justify-between"
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

    <div>
        {#each projects as project (project.id)}
            <div class="w-full">
                <button 
                    class="w-full flex gap-4 justify-between items-center cursor-poiner hover:bg-white/5 p-1 rounded-lg"
                    onclick={onToggleProjectHandle(project)}
                >
                    <span class="font-semibold">{project.name}</span>

                    <div class="btn btn-ghost btn-xs">
                        <Icon icon={!project.isOpen ? "material-symbols:keyboard-arrow-up-rounded" : "material-symbols:keyboard-arrow-down-rounded"}/>
                    </div>
                </button>

                {#if project.isOpen}
                    {#each project.entries as entry}
                        <Entry 
                            {entry}
                            {onToggleEntry}
                        />
                    {/each}
                {/if}
            </div>
        {/each}
    </div>
</div>
