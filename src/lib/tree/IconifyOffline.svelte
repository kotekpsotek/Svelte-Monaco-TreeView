<script lang="ts">
    import BaseIcon from "@iconify/svelte";
    import "$lib/iconify-offline";

    type Props = {
        icon: string;
    } & Record<string, unknown>;

    let { icon, ...rest }: Props = $props();
</script>

<BaseIcon {icon} {...rest} />
