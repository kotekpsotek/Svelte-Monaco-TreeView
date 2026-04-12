<script lang="ts" module>
	import type { Snippet } from "svelte";
    import type { ContextMenuItem } from "../contextmenu/MonacoContextMenu.svelte";
    import type { File, Folder, Project } from "./types.ts";

    export type ProjectContextMenuAction = "toggle-project" | "new-file" | "new-folder" | "new-project" | "refresh";
    export type FileContextMenuAction = "select-file" | "unselect-file" | "refresh";
    export type FolderContextMenuAction = "toggle-folder" | "new-file" | "new-folder" | "refresh";

    export interface ProjectContextMenuSnippetProps {
        x: number;
        y: number;
        project: Project;
        closeMenu: () => void;
        runDefaultAction: (action: ProjectContextMenuAction) => Promise<void>;
    }

    export interface FileContextMenuSnippetProps {
        x: number;
        y: number;
        file: File;
        closeMenu: () => void;
        runDefaultAction: (action: FileContextMenuAction) => Promise<void>;
    }

    export interface FolderContextMenuSnippetProps {
        x: number;
        y: number;
        folder: Folder;
        closeMenu: () => void;
        runDefaultAction: (action: FolderContextMenuAction) => Promise<void>;
    }

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
        onProjectContextAction?: (action: ProjectContextMenuAction, project: Project) => void | Promise<void>;
        onFileContextAction?: (action: FileContextMenuAction, file: File) => void | Promise<void>;
        onFolderContextAction?: (action: FolderContextMenuAction, folder: Folder) => void | Promise<void>;
        projectContextMenu?: Snippet<[ProjectContextMenuSnippetProps]>;
        fileContextMenu?: Snippet<[FileContextMenuSnippetProps]>;
        folderContextMenu?: Snippet<[FolderContextMenuSnippetProps]>;
        version?: "mobile" | "desktop";
        noProjectContainer?: Snippet;
    }
</script>

<script lang="ts">
	import Entry from "./Entry.svelte";
    import MonacoContextMenu, { type ContextMenuItem as ContextMenuOption } from "../contextmenu/MonacoContextMenu.svelte";

    import Icon from "./IconifyOffline.svelte"
	import { activeContextMenu, openFileIds, openFolderIds, openProjectIds, openProjects } from "./store.ts";

    const defaultProjectMenuItems: ContextMenuOption[] = [
        { id: "toggle-project", label: "Toggle Project" },
        { id: "new-file", label: "New File" },
        { id: "new-folder", label: "New Folder" },
        { id: "new-project", label: "New Project" },
        { id: "refresh", label: "Refresh" }
    ];

    const defaultFileMenuItems: ContextMenuOption[] = [
        { id: "select-file", label: "Select File" },
        { id: "refresh", label: "Refresh" }
    ];

    const defaultFolderMenuItems: ContextMenuOption[] = [
        { id: "toggle-folder", label: "Toggle Folder" },
        { id: "new-file", label: "New File" },
        { id: "new-folder", label: "New Folder" },
        { id: "refresh", label: "Refresh" }
    ];

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
        onNewFile,
        onNewFolder,
        onNewProject,
        onRefreshTreeView,
        onProjectContextAction,
        onFileContextAction,
        onFolderContextAction,
        projectContextMenu,
        fileContextMenu,
        folderContextMenu,
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

    function closeContextMenu() {
        $activeContextMenu = null;
    }

    function removeId(list: string[], id: string): string[] {
        const index = list.findIndex((listId) => listId === id);
        if (index === -1) {
            return list;
        }

        return [...list.slice(0, index), ...list.slice(index + 1)];
    }

    function toggleProjectOpen(project: Project) {
        if ($openProjectIds.includes(project.id)) {
            $openProjectIds = removeId($openProjectIds, project.id);
        }
        else {
            $openProjectIds = [...$openProjectIds, project.id];
        }

        onToggleProject(project);
    }

    function toggleFolderOpen(folder: Folder) {
        if ($openFolderIds.includes(folder.id)) {
            $openFolderIds = removeId($openFolderIds, folder.id);
        }
        else {
            $openFolderIds = [...$openFolderIds, folder.id];
        }

        onToggleEntry(folder);
    }

    function selectFile(file: File) {
        if ($openFileIds.includes(file.id)) {
            return;
        }

        if (oneFileSelected) {
            $openFileIds = [file.id];
        }
        else {
            $openFileIds = [...$openFileIds, file.id];
        }

        onToggleEntry(file);
    }

    function unselectFile(file: File) {
        if (!$openFileIds.includes(file.id)) {
            return;
        }

        $openFileIds = removeId($openFileIds, file.id);
        onToggleEntry(file);
    }

    function projectMenuItems(project: Project): ContextMenuOption[] {
        return defaultProjectMenuItems.map((menuItem) => {
            if (menuItem.id !== "toggle-project") {
                return menuItem;
            }

            return {
                ...menuItem,
                label: $openProjectIds.includes(project.id) ? "Collapse Project" : "Expand Project"
            };
        });
    }

    function fileMenuItems(file: File): ContextMenuOption[] {
        const fileIsSelected = $openFileIds.includes(file.id);

        return defaultFileMenuItems.map((menuItem) => {
            if (menuItem.id !== "select-file") {
                return menuItem;
            }

            return {
                ...menuItem,
                id: fileIsSelected ? "unselect-file" : "select-file",
                label: fileIsSelected ? "Unselect File" : "Select File"
            };
        });
    }

    function folderMenuItems(folder: Folder): ContextMenuOption[] {
        return defaultFolderMenuItems.map((menuItem) => {
            if (menuItem.id !== "toggle-folder") {
                return menuItem;
            }

            return {
                ...menuItem,
                label: $openFolderIds.includes(folder.id) ? "Collapse Folder" : "Expand Folder"
            };
        });
    }

    async function runProjectDefaultAction(action: ProjectContextMenuAction, project: Project) {
        if (action === "toggle-project") {
            toggleProjectOpen(project);
        }
        else if (action === "new-file") {
            await onNewFile();
        }
        else if (action === "new-folder") {
            await onNewFolder();
        }
        else if (action === "new-project") {
            await onNewProject();
        }
        else if (action === "refresh") {
            await onRefreshTreeView();
        }

        await onProjectContextAction?.(action, project);
    }

    async function runFileDefaultAction(action: FileContextMenuAction, file: File) {
        if (action === "select-file") {
            selectFile(file);
        }
        else if (action === "unselect-file") {
            unselectFile(file);
        }
        else if (action === "refresh") {
            await onRefreshTreeView();
        }

        await onFileContextAction?.(action, file);
    }

    async function runFolderDefaultAction(action: FolderContextMenuAction, folder: Folder) {
        if (action === "toggle-folder") {
            toggleFolderOpen(folder);
        }
        else if (action === "new-file") {
            await onNewFile();
        }
        else if (action === "new-folder") {
            await onNewFolder();
        }
        else if (action === "refresh") {
            await onRefreshTreeView();
        }

        await onFolderContextAction?.(action, folder);
    }

    async function onProjectMenuAction(itemId: string, project: Project) {
        await runProjectDefaultAction(itemId as ProjectContextMenuAction, project);
        closeContextMenu();
    }

    async function onFileMenuAction(itemId: string, file: File) {
        await runFileDefaultAction(itemId as FileContextMenuAction, file);
        closeContextMenu();
    }

    async function onFolderMenuAction(itemId: string, folder: Folder) {
        await runFolderDefaultAction(itemId as FolderContextMenuAction, folder);
        closeContextMenu();
    }

    function onProjectContextMenu(project: Project) {
        return (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            $activeContextMenu = {
                kind: "project",
                x: event.clientX,
                y: event.clientY,
                project
            };
        };
    }

    function isProjectContextMenuOpen(project: Project) {
        return $activeContextMenu?.kind === "project" && $activeContextMenu.project.id === project.id;
    }

    function onEntryContextMenu(event: MouseEvent, entry: File | Folder) {
        event.preventDefault();
        event.stopPropagation();

        if (entry.type === "file") {
            $activeContextMenu = {
                kind: "file",
                x: event.clientX,
                y: event.clientY,
                file: entry
            };

            return;
        }

        $activeContextMenu = {
            kind: "folder",
            x: event.clientX,
            y: event.clientY,
            folder: entry
        };
    }

    $effect(() => {
        $activeContextMenu;

        if (!activeContextMenu) {
            return;
        }

        const handleWindowClick = () => {
            closeContextMenu();
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeContextMenu();
            }
        };

        window.addEventListener("click", handleWindowClick);
        window.addEventListener("resize", handleWindowClick);
        window.addEventListener("scroll", handleWindowClick, true);
        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("click", handleWindowClick);
            window.removeEventListener("resize", handleWindowClick);
            window.removeEventListener("scroll", handleWindowClick, true);
            window.removeEventListener("keydown", handleEscape);
        };
    });

    function onToggleProjectHandle(project: Project) {
        return () => {
            toggleProjectOpen(project);
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
                        class={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border p-1 transition-colors hover:bg-white/5 ${isProjectContextMenuOpen(project) ? 'border-blue-400/90 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.9)]' : 'border-transparent'}`}
                        onclick={onToggleProjectHandle(project)}
                        oncontextmenu={onProjectContextMenu(project)}
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
                            {#each sortedEntries as entry (entry.id)}
                                <Entry
                                    {clickToUnselectFile}
                                    {oneFileSelected}
                                    {entry}
                                    {onToggleEntry}
                                    {onEntryContextMenu}
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

{#if $activeContextMenu}
    {#if $activeContextMenu.kind === "project"}
        {#if projectContextMenu}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="fixed z-[1000]" style="left: {$activeContextMenu.x}px; top: {$activeContextMenu.y}px;" onclick={(event) => event.stopPropagation()}>
                {@render projectContextMenu({
                    x: $activeContextMenu.x,
                    y: $activeContextMenu.y,
                    project: $activeContextMenu.project,
                    closeMenu: closeContextMenu,
                    runDefaultAction: async (action) => {
                        await runProjectDefaultAction(action, ($activeContextMenu as any as ProjectContextMenuSnippetProps)?.project);
                        closeContextMenu();
                    }
                })}
            </div>
        {:else}
            <MonacoContextMenu
                x={$activeContextMenu?.x}
                y={$activeContextMenu?.y}
                items={projectMenuItems($activeContextMenu?.project)}
                onClose={closeContextMenu}
                onSelect={async (itemId) => {
                    await onProjectMenuAction(itemId, ($activeContextMenu as any as ProjectContextMenuSnippetProps)?.project);
                }}
            />
        {/if}
    {:else if $activeContextMenu?.kind === "file"}
        {#if fileContextMenu}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="fixed z-[1000]" style="left: {$activeContextMenu?.x}px; top: {$activeContextMenu?.y}px;" onclick={(event) => event.stopPropagation()}>
                {@render fileContextMenu({
                    x: $activeContextMenu?.x,
                    y: $activeContextMenu?.y,
                    file: $activeContextMenu?.file,
                    closeMenu: closeContextMenu,
                    runDefaultAction: async (action) => {
                        await runFileDefaultAction(action, ($activeContextMenu as any as FileContextMenuSnippetProps)?.file);
                        closeContextMenu();
                    }
                })}
            </div>
        {:else}
            <MonacoContextMenu
                x={$activeContextMenu?.x}
                y={$activeContextMenu?.y}
                items={fileMenuItems($activeContextMenu?.file)}
                onClose={closeContextMenu}
                onSelect={async (itemId) => {
                    await onFileMenuAction(itemId, ($activeContextMenu as any as FileContextMenuSnippetProps)?.file);
                }}
            />
        {/if}
    {:else}
        {#if folderContextMenu}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="fixed z-[1000]" style="left: {$activeContextMenu?.x}px; top: {$activeContextMenu?.y}px;" onclick={(event) => event.stopPropagation()}>
                {@render folderContextMenu({
                    x: $activeContextMenu?.x,
                    y: $activeContextMenu?.y,
                    folder: $activeContextMenu?.folder,
                    closeMenu: closeContextMenu,
                    runDefaultAction: async (action) => {
                        await runFolderDefaultAction(action, ($activeContextMenu as any as FolderContextMenuSnippetProps)?.folder);
                        closeContextMenu();
                    }
                })}
            </div>
        {:else}
            <MonacoContextMenu
                x={$activeContextMenu?.x}
                y={$activeContextMenu?.y}
                items={folderMenuItems($activeContextMenu?.folder)}
                onClose={closeContextMenu}
                onSelect={async (itemId) => {
                    await onFolderMenuAction(itemId, ($activeContextMenu as any as FolderContextMenuSnippetProps)?.folder);
                }}
            />
        {/if}
    {/if}
{/if}

