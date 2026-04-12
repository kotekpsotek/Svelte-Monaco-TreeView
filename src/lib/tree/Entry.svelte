<script lang="ts">
	import type { Props } from "./MonacoTree.svelte";
	import type { Folder, File } from "./types.ts";
    import ProgrammingIcon from "./Icon.svelte";
    import Icon from "./IconifyOffline.svelte";
    import Self from "../tree/Entry.svelte"
	import { openFileIds, openFolderIds } from "./store.ts";

    type Prop = Pick<Props, "onToggleEntry" | "oneFileSelected" | "clickToUnselectFile"> & { entry: File | Folder }

    let {
        entry,
        oneFileSelected,
        clickToUnselectFile,
        onToggleEntry
    }: Prop = $props();

    let isFolderAndOpen = $derived(entry.type === "folder" && $openFolderIds.some(folderID => folderID === entry.id))
    let isFileAndOpen = $derived(entry.type === "file" && $openFileIds.some(fileID => fileID === entry.id))
    let isOpen = $derived(isFolderAndOpen || isFileAndOpen ? true : false);
    
    function onToggleEntryLocal(entry: File | Folder) {
        return () => {
            if (entry.type === "folder") {
                if (isFolderAndOpen) {
                    const thisFolderListId = $openFolderIds.findIndex(folderId => folderId === entry.id);
                    $openFolderIds.splice(thisFolderListId);

                    $openFolderIds = $openFolderIds;
                }
                else $openFolderIds = [...$openFolderIds, entry.id];
            }
            else if (entry.type === "file") {
                if (isFileAndOpen && clickToUnselectFile) {
                    const thisFileListIndex = $openFileIds.findIndex(fileId => fileId === entry.id);
                    if (thisFileListIndex > -1) {
                        $openFileIds.splice(thisFileListIndex, 1);
                        $openFileIds = $openFileIds;
                    }
                }
                else if ($openFileIds.length >= 1 && !oneFileSelected) {
                    $openFileIds = [...$openFileIds, entry.id];
                }
                else {
                    $openFileIds = [entry.id];
                }
            }
            
            // Emit for different folders
            onToggleEntry(entry);
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

    function onEntryContextMenu() {

    }
</script>

<div class="w-full">
    <div class="{entry.type === "file" ? "ml-2" : ""}">
        <button 
            class="entry-register p-1 w-full flex gap-1 items-center cursor-pointer hover:bg-white/5 rounded-lg {isFileAndOpen ? "bg-white/10" : ""}"
            onclick={onToggleEntryLocal(entry)}
            oncontextmenu={onEntryContextMenu}
        >
            {#if entry.type === "folder"}
                <span>
                    <Icon icon={isOpen ? "material-symbols:keyboard-arrow-up-rounded" : "material-symbols:keyboard-arrow-down-rounded"}/>
                </span>
            {/if}
    
            <span>
                <ProgrammingIcon {entry}/>
            </span>
    
            <span>{entry.name}</span>
        </button>
    </div>

    {#if isFolderAndOpen && entry.type === "folder"}
        <div class="ml-4">
            {#each sortEntries(entry.subentries) as subentry}
                <Self 
                    entry={subentry}
                    {clickToUnselectFile}
                    {oneFileSelected}
                    {onToggleEntry}
                />
            {/each}
        </div>
    {/if}
</div>
