<script lang="ts" module>
    export interface ContextMenuItem {
        id: string;
        label: string;
        disabled?: boolean;
        danger?: boolean;
    }

    export interface Props {
        x: number;
        y: number;
        items: ContextMenuItem[];
        onSelect: (itemId: string) => void | Promise<void>;
        onClose: () => void;
    }
</script>

<script lang="ts">
    let {
        x,
        y,
        items,
        onSelect,
        onClose
    }: Props = $props();

    let menuElement: HTMLDivElement | null = $state(null);
    let menuStyle = $state("left: 0px; top: 0px;");

    const viewportPadding = 8;

    $effect(() => {
        x;
        y;
        menuElement;

        if (!menuElement) {
            return;
        }

        const rafId = window.requestAnimationFrame(() => {
            if (!menuElement) {
                return;
            }

            const menuRect = menuElement.getBoundingClientRect();
            const maxX = Math.max(viewportPadding, window.innerWidth - menuRect.width - viewportPadding);
            const maxY = Math.max(viewportPadding, window.innerHeight - menuRect.height - viewportPadding);
            const left = Math.min(Math.max(x, viewportPadding), maxX);
            const top = Math.min(Math.max(y, viewportPadding), maxY);

            menuStyle = `left: ${left}px; top: ${top}px;`;
        });

        return () => {
            window.cancelAnimationFrame(rafId);
        };
    });

    async function onSelectItem(item: ContextMenuItem) {
        if (item.disabled) {
            return;
        }

        await onSelect(item.id);
    }
</script>

<div
    bind:this={menuElement}
    class="fixed z-[1000] min-w-[200px] overflow-hidden rounded-[10px] border border-white/15 bg-slate-900/95 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-[8px]"
    style={menuStyle}
    role="menu"
    tabindex="-1"
    oncontextmenu={(event) => event.preventDefault()}
    onclick={(event) => event.stopPropagation()}
    onkeydown={(event) => {
        if (event.key === "Escape") {
            onClose();
        }
    }}
>
    <ul class="m-0 list-none p-1.5">
        {#each items as item (item.id)}
            <li>
                <button
                    type="button"
                    class={`w-full rounded-lg border-0 bg-transparent px-2.5 py-2 text-left text-[0.86rem] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/90 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900/80 disabled:cursor-not-allowed disabled:opacity-45 ${item.danger ? 'text-red-200/95' : 'text-slate-100/95'}`}
                    role="menuitem"
                    disabled={item.disabled}
                    onclick={() => onSelectItem(item)}
                >
                    {item.label}
                </button>
            </li>
        {/each}
    </ul>
</div>
