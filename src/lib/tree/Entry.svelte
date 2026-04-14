<script lang="ts">
    import type { Snippet } from "svelte";
    import type { File, Folder } from "./types.ts";
    import ProgrammingIcon from "./Icon.svelte";
    import Icon from "./IconifyOffline.svelte";
    import EntryNameEditor from "./EntryNameEditor.svelte";
    import Self from "../tree/Entry.svelte";
    import { activeContextMenu, openFileIds, openFolderIds } from "./store.ts";

    interface RenameState {
        projectId: string;
        entryId: string;
        kind: "file" | "folder";
    }

    interface CreateState {
        projectId: string;
        folderId: string | null;
        kind: "file" | "folder";
    }

    type DropTarget =
        | {
            kind: "project";
            projectId: string;
        }
        | {
            kind: "folder";
            projectId: string;
            folderId: string;
        };

    interface Props {
        projectId: string;
        entry: File | Folder;
        CustomFileElement?: Snippet<[File]>;
        CustomFolderElement?: Snippet<[Folder]>;
        oneFileSelected: boolean;
        clickToUnselectFile: boolean;
        onToggleEntry: (entry: File | Folder) => void | Promise<void>;
        onEntryContextMenu?: (event: MouseEvent, entry: File | Folder, projectId: string) => void;
        renameState: RenameState | null;
        createState: CreateState | null;
        onAcceptRename: (entry: File | Folder, projectId: string, name: string) => void | Promise<void>;
        onCancelRename: () => void;
        onAcceptCreate: (name: string) => void | Promise<void>;
        onCancelCreate: () => void;
        onEntryDragStart: (event: DragEvent, entry: File | Folder, projectId: string) => void;
        onEntryDragEnd: () => void;
        onFolderDrop: (event: DragEvent, folder: Folder, projectId: string) => void;
        onFolderDragOver: (event: DragEvent, folderId: string, projectId: string) => void;
        onDropTargetDragLeave: (event: DragEvent, target: DropTarget) => void;
        activeDropTarget: DropTarget | null;
    }

    let {
        projectId,
        entry,
        CustomFileElement,
        CustomFolderElement,
        oneFileSelected,
        clickToUnselectFile,
        onToggleEntry,
        onEntryContextMenu: onEntryContextMenuFromTree,
        renameState,
        createState,
        onAcceptRename,
        onCancelRename,
        onAcceptCreate,
        onCancelCreate,
        onEntryDragStart,
        onEntryDragEnd,
        onFolderDrop,
        onFolderDragOver,
        onDropTargetDragLeave,
        activeDropTarget
    }: Props = $props();

    let isFolderAndOpen = $derived(entry.type === "folder" && $openFolderIds.some((folderId) => folderId === entry.id));
    let isFileAndOpen = $derived(entry.type === "file" && $openFileIds.some((fileId) => fileId === entry.id));
    let isOpen = $derived(isFolderAndOpen || isFileAndOpen);
    let isContextMenuOpen = $derived.by(() => {
        if (!$activeContextMenu) {
            return false;
        }

        if (entry.type === "file") {
            return $activeContextMenu.kind === "file" && $activeContextMenu.file.id === entry.id;
        }

        return $activeContextMenu.kind === "folder" && $activeContextMenu.folder.id === entry.id;
    });
    let isRenameTarget = $derived(
        renameState?.projectId === projectId && renameState.entryId === entry.id && renameState.kind === entry.type
    );
    let isFolderDropHighlight = $derived(
        entry.type === "folder" &&
        activeDropTarget?.kind === "folder" &&
        activeDropTarget.projectId === projectId &&
        activeDropTarget.folderId === entry.id
    );

    function removeId(list: string[], id: string): string[] {
        const index = list.findIndex((listId) => listId === id);
        if (index === -1) {
            return list;
        }

        return [...list.slice(0, index), ...list.slice(index + 1)];
    }

    function onToggleEntryLocal(entryToToggle: File | Folder) {
        return () => {
            if (entryToToggle.type === "folder") {
                if (isFolderAndOpen) {
                    $openFolderIds = removeId($openFolderIds, entryToToggle.id);
                }
                else {
                    $openFolderIds = [...$openFolderIds, entryToToggle.id];
                }
            }
            else if (entryToToggle.type === "file") {
                if (isFileAndOpen && clickToUnselectFile) {
                    $openFileIds = removeId($openFileIds, entryToToggle.id);
                }
                else if ($openFileIds.length >= 1 && !oneFileSelected) {
                    $openFileIds = [...$openFileIds, entryToToggle.id];
                }
                else {
                    $openFileIds = [entryToToggle.id];
                }
            }

            onToggleEntry(entryToToggle);
        };
    }

    function sortEntries(entries: Array<File | Folder>) {
        return [...entries].sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === "folder" ? -1 : 1;
            }

            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        });
    }

    function onEntryContextMenu(entryWithContext: File | Folder) {
        return (event: MouseEvent) => {
            onEntryContextMenuFromTree?.(event, entryWithContext, projectId);
        };
    }

    function onDragStart(event: DragEvent) {
        onEntryDragStart(event, entry, projectId);
    }
</script>

<div class="w-full">
    <div class={entry.type === "file" ? "ml-2" : ""}>
        {#if isRenameTarget}
            <div class="flex w-full items-center gap-2 rounded-lg bg-base-content/5 px-1">
                {#if entry.type === "folder"}
                    <span>
                        <Icon icon={isOpen ? "material-symbols:keyboard-arrow-up-rounded" : "material-symbols:keyboard-arrow-down-rounded"} />
                    </span>
                {/if}

                <span>
                    <ProgrammingIcon {entry} />
                </span>

                <EntryNameEditor
                    kind={entry.type}
                    initialName={entry.name}
                    placeholder={entry.type === "folder" ? "Folder name" : "File name"}
                    onAccept={async (name) => {
                        await onAcceptRename(entry, projectId, name);
                    }}
                    onCancel={onCancelRename}
                />
            </div>
        {:else}
            <button
                class={`entry-register select-none p-1 w-full flex items-center justify-between gap-2 cursor-pointer hover:bg-base-content/5 rounded-lg border border-transparent ${isFileAndOpen ? "bg-base-content/10" : ""} ${isFolderDropHighlight ? "bg-sky-500/20 border-sky-400 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.65)]" : ""}`}
                class:context-menu-open={isContextMenuOpen}
                onclick={onToggleEntryLocal(entry)}
                oncontextmenu={onEntryContextMenu(entry)}
                draggable={true}
                ondragstart={onDragStart}
                ondragend={onEntryDragEnd}
                ondragover={entry.type === "folder"
                    ? (event) => onFolderDragOver(event, entry.id, projectId)
                    : undefined}
                ondragleave={entry.type === "folder"
                    ? (event) =>
                        onDropTargetDragLeave(event, {
                            kind: "folder",
                            projectId,
                            folderId: entry.id
                        })
                    : undefined}
                ondrop={entry.type === "folder"
                    ? (event) => onFolderDrop(event, entry as Folder, projectId)
                    : undefined}
            >
                <span class="inline-flex min-w-0 items-center gap-1">
                    {#if entry.type === "folder"}
                        <span>
                            <Icon icon={isOpen ? "material-symbols:keyboard-arrow-up-rounded" : "material-symbols:keyboard-arrow-down-rounded"} />
                        </span>
                    {/if}

                    <span>
                        <ProgrammingIcon {entry} />
                    </span>

                    <span>{entry.name}</span>
                </span>

                <span class="inline-flex items-center gap-2">
                    {#if entry.type === "file" && CustomFileElement}
                        {@render CustomFileElement(entry)}
                    {:else if entry.type === "folder" && CustomFolderElement}
                        {@render CustomFolderElement(entry)}
                    {/if}
                </span>
            </button>
        {/if}
    </div>

    {#if isFolderAndOpen && entry.type === "folder"}
        {@const shouldShowCreateEditor = createState?.projectId === projectId && createState.folderId === entry.id}
        <div class="ml-4">
            {#if shouldShowCreateEditor}
                <div class="flex w-full items-center gap-2 rounded-lg bg-base-content/5 px-1">
                    <EntryNameEditor
                        kind={createState?.kind ?? "file"}
                        initialName=""
                        placeholder={createState?.kind === "folder" ? "New folder name" : "New file name"}
                        showProgrammingIcon
                        onAccept={onAcceptCreate}
                        onCancel={onCancelCreate}
                    />
                </div>
            {/if}

            {#each sortEntries(entry.subentries) as subentry (subentry.id)}
                <Self
                    {projectId}
                    entry={subentry}
                    {CustomFileElement}
                    {CustomFolderElement}
                    {clickToUnselectFile}
                    {oneFileSelected}
                    {onToggleEntry}
                    onEntryContextMenu={onEntryContextMenuFromTree}
                    {renameState}
                    {createState}
                    {onAcceptRename}
                    {onCancelRename}
                    {onAcceptCreate}
                    {onCancelCreate}
                    {onEntryDragStart}
                    {onEntryDragEnd}
                    {onFolderDrop}
                    {onFolderDragOver}
                    {onDropTargetDragLeave}
                    {activeDropTarget}
                />
            {/each}
        </div>
    {/if}
</div>

<style>
    .context-menu-open {
        border-color: rgb(96 165 250 / 0.9);
        box-shadow: inset 0 0 0 1px rgb(96 165 250 / 0.9);
    }
</style>
