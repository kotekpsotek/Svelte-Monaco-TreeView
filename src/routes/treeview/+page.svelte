<script lang="ts">
	import MonacoTree, { type Props } from "$lib/tree/MonacoTree.svelte";
	import type { Project } from "$lib/tree/types.ts";

    const projects: Project[] = [
        {
            id: "monaco-editor-tree-view",
            name: "Monaco Editor Tree View",
            gitRepositoryURL: "https://github.com/ravenone/monaco-editor-tree-view",
            isOpen: true,
            entries: [
                {
                    id: "monaco-src",
                    type: "folder",
                    name: "src",
                    isOpen: true,
                    subentries: [
                        {
                            id: "monaco-tree-component",
                            type: "file",
                            name: "MonacoTree.svelte"
                        },
                        {
                            id: "monaco-tree-types",
                            type: "file",
                            name: "types.ts"
                        },
                        {
                            id: "monaco-tree-icons",
                            type: "folder",
                            name: "icons",
                            isOpen: false,
                            subentries: [
                                {
                                    id: "monaco-tree-icon-file",
                                    type: "file",
                                    name: "file.svg"
                                },
                                {
                                    id: "monaco-tree-icon-folder",
                                    type: "file",
                                    name: "folder.svg"
                                }
                            ]
                        }
                    ]
                },
                {
                    id: "monaco-readme",
                    type: "file",
                    name: "README.md"
                }
            ]
        },
        {
            id: "tree-view-showcase",
            name: "Tree View Showcase",
            gitRepositoryURL: "https://github.com/ravenone/tree-view-showcase",
            isOpen: true,
            entries: [
                {
                    id: "showcase-components",
                    type: "folder",
                    name: "components",
                    isOpen: true,
                    subentries: [
                        {
                            id: "showcase-header",
                            type: "file",
                            name: "Header.svelte"
                        },
                        {
                            id: "showcase-header-story",
                            type: "file",
                            name: "Header.stories.svelte"
                        },
                        {
                            id: "showcase-assets",
                            type: "folder",
                            name: "assets",
                            isOpen: false,
                            subentries: [
                                {
                                    id: "showcase-logo",
                                    type: "file",
                                    name: "logo.svg"
                                },
                                {
                                    id: "showcase-hero",
                                    type: "file",
                                    name: "hero.png"
                                }
                            ]
                        }
                    ]
                },
                {
                    id: "showcase-notes",
                    type: "folder",
                    name: "notes",
                    isOpen: false,
                    subentries: [
                        {
                            id: "showcase-roadmap",
                            type: "file",
                            name: "roadmap.md"
                        },
                        {
                            id: "showcase-todo",
                            type: "file",
                            name: "todo.md"
                        }
                    ]
                }
            ]
        }
    ];

    const onToggleEntry: Props["onToggleEntry"] = (entry) => {

    }

    const onToggleProject: Props["onToggleProject"] = (project) => {

    }

    const onNewFile: Props["onNewFile"] = () => {

    }

    const onNewFolder: Props["onNewFolder"] = () => {

    }
    
    const onNewProject: Props["onNewProject"] = () => {

    }

    const onRefreshTreeView: Props["onRefreshTreeView"] = () => {
        
    }
</script>

<div class="w-[500px]">
    <MonacoTree
        treeName="Test Tree"
        {projects}
        {onToggleEntry}
        {onToggleProject}
        {onNewFile}
        {onNewFolder}
        {onNewProject}
        {onRefreshTreeView}
    />
</div>
