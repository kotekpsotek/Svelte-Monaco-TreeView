<script lang="ts">
	import type { Props } from "./MonacoTree.svelte";
	import type { Folder, File } from "./types.ts";
    import ProgrammingIcon from "./Icon.svelte";
    import Icon from "./IconifyOffline.svelte";
    import Self from "../tree/Entry.svelte"
	import { openFileIds, openFolderIds } from "./store.ts";

    type Prop = Pick<Props, "onToggleEntry"> & { entry: File | Folder }

    let {
        entry,
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
            
            // Emit for different folders
            onToggleEntry(entry);
        }
    }
</script>

<div class="w-full">
    <button 
        class="entry-register w-full flex gap-1 items-center cursor-pointer hover:bg-white/5"
        onclick={onToggleEntryLocal(entry)}
    >
        {#if entry.type === "folder"}
            <span>
                <Icon icon={isOpen ? "material-symbols:keyboard-arrow-up-rounded" : "material-symbols:keyboard-arrow-down-rounded"}/>
            </span>
        {/if}

        <span
            class="{entry.type === "file" ? "ml-5" : ""}"
        >
            <ProgrammingIcon {entry}/>
        </span>

        <span>{entry.name}</span>
    </button>

    {#if isFolderAndOpen && entry.type === "folder"}
        <div class="pl-4">
            {#each entry.subentries as subentry}
                <Self entry={subentry} {onToggleEntry}/>
            {/each}
        </div>
    {/if}
</div>
