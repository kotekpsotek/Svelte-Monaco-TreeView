<script lang=ts>
	import MonacoTree from "$lib/tree/MonacoTree.svelte";
</script>

<MonacoTree
    version="desktop"
    projects={[
        {
            name: "project name",
            isOpen: true,
            entries: [
                {
                    type: "file",
                    name: "The entry name.svelte"
                }
            ]
        }
    ]}
    onToggleEntry={() => {}}
    onToggleProject={() => {}}
/>
