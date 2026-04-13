<script lang="ts" module>
    import type { File, Folder } from "./types.ts";

    export interface Props {
        initialName?: string;
        value?: string;
        kind: "project" | "file" | "folder";
        placeholder?: string;
        showProgrammingIcon?: boolean;
        onAccept: (name: string) => void | Promise<void>;
        onCancel: () => void;
    }
</script>

<script lang="ts">
    import ProgrammingIcon from "./Icon.svelte";
    import Icon from "./IconifyOffline.svelte";

    let {
        initialName = "",
        value = $bindable(""),
        placeholder = "Enter name",
        kind,
        showProgrammingIcon = false,
        onAccept,
        onCancel
    }: Props = $props();

    let previewEntry = $derived.by((): File | Folder | null => {
        if (!showProgrammingIcon || kind === "project") {
            return null;
        }

        if (kind === "file") {
            return {
                id: "entry-name-editor-preview",
                type: "file",
                name: value
            };
        }

        return {
            id: "entry-name-editor-preview",
            type: "folder",
            name: value,
            subentries: []
        };
    });

    $effect(() => {
        initialName;

        value = initialName;
    });

    function focusInputOnMount(node: HTMLInputElement) {
        queueMicrotask(() => {
            node.focus();
            node.select();
        });
    }

    async function accept() {
        const nextName = value.trim();
        if (!nextName.length) {
            return;
        }

        await onAccept(nextName);
    }

    function onInputKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            void accept();
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            void accept();
        }
    }
</script>

<div class="flex w-full items-center gap-2">
    {#if previewEntry}
        <span class="flex shrink-0 items-center" aria-hidden="true">
            <ProgrammingIcon entry={previewEntry} />
        </span>
    {/if}

    <input
        {@attach focusInputOnMount}
        bind:value
        class="input rounded-none bg-transparent w-full outline-none border-none active:border-none"
        class:font-semibold={kind === "project"}
        placeholder={placeholder}
        onkeydown={onInputKeydown}
    />

    <div class="flex items-center gap-1">
        <button
            type="button"
            class="btn btn-sm btn-ghost"
            title="Accept"
            onclick={() => void accept()}
        >
            <Icon icon="material-symbols:check-rounded"/>
        </button>

        <button
            type="button"
            class="btn btn-sm btn-ghost"
            title="Cancel"
            onclick={onCancel}
        >
            <Icon icon="material-symbols:close-rounded"/>
        </button>
    </div>
</div>
