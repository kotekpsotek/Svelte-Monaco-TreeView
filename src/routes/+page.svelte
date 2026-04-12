<script lang=ts>
	import MonacoTree from "$lib/tree/MonacoTree.svelte";
</script>

<MonacoTree
    treeName="Project Tree"
    version="desktop"
    projects={[
        {
            id: "project-name",
            name: "project name",
            isOpen: true,
            entries: [
                {
                    id: "the-entry-name",
                    type: "file",
                    name: "The entry name.svelte"
                }
            ]
        }
    ]}
    onToggleEntry={() => {}}
    onToggleProject={() => {}}
/>
