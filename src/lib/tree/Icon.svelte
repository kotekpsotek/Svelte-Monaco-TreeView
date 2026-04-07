<script lang="ts">
    import Icon from "@iconify/svelte";
    import { iconsSet } from "./icon.ts";
	import type { File, Folder } from "./types.ts";

    const packagedIconModules = import.meta.glob("./icons/*.svg", {
        eager: true,
        import: "default"
    }) as Record<string, string>;

    const packagedIconUrlMap = new Map<string, string>();
    for (const [modulePath, iconUrl] of Object.entries(packagedIconModules)) {
        const iconFileName = modulePath.split(/[\\/]/).pop();
        if (iconFileName) {
            packagedIconUrlMap.set(iconFileName, iconUrl);
        }
    }

    const extensionAliases = new Map<string, string[]>([
        ["ts", ["typescript"]],
        ["tsx", ["reactts", "typescript"]],
        ["js", ["js", "javascript", "js_official"]],
        ["jsx", ["reactjs", "javascript"]],
        ["mjs", ["javascript"]],
        ["cjs", ["javascript"]],
        ["json", ["json", "json_official"]],
        ["md", ["markdown"]],
        ["yml", ["yaml", "yaml_official"]],
        ["yaml", ["yaml", "yaml_official"]],
        ["htm", ["html"]],
        ["env", ["dotenv"]],
        ["sh", ["shell"]],
        ["bash", ["shell"]],
        ["zsh", ["shell"]],
        ["ps1", ["powershell"]],
        ["py", ["python"]],
        ["rs", ["rust"]],
        ["kt", ["kotlin"]],
        ["cs", ["csharp"]],
        ["cpp", ["cpp"]],
        ["cc", ["cpp"]],
        ["cxx", ["cpp"]],
        ["h", ["cheader", "cppheader"]],
        ["hpp", ["cppheader"]]
    ]);

    const fileIconMap = new Map<string, string>();
    const folderIconMap = new Map<string, string>();

    for (const icon of iconsSet) {
        if ("fileExtensions" in icon) {
            for (const extension of icon.fileExtensions) {
                const normalizedExtension = extension.toLowerCase();
                if (normalizedExtension !== "*" && !fileIconMap.has(normalizedExtension)) {
                    fileIconMap.set(normalizedExtension, icon.iconFileName);
                }
            }
            continue;
        }

        for (const extension of icon.folderMajorityFileExtensions) {
            const normalizedExtension = extension.toLowerCase();
            if (normalizedExtension !== "*" && !folderIconMap.has(normalizedExtension)) {
                folderIconMap.set(normalizedExtension, icon.iconFileName);
            }
        }
    }

    const getFileExtension = (name: string): string | null => {
        const normalizedName = name.trim().toLowerCase();
        if (!normalizedName) {
            return null;
        }

        const dotIndex = normalizedName.lastIndexOf(".");
        if (dotIndex === -1 || dotIndex === normalizedName.length - 1) {
            return null;
        }

        // Support hidden dot files and extension-only inputs like ".ts".
        if (dotIndex === 0) {
            return normalizedName.slice(1);
        }

        return normalizedName.slice(dotIndex + 1);
    };

    const getFileLookupKey = (name: string): string | null => {
        const normalizedName = name.trim().toLowerCase();
        if (!normalizedName) {
            return null;
        }

        const extension = getFileExtension(normalizedName);
        if (extension) {
            return extension;
        }

        if (normalizedName.startsWith(".")) {
            return normalizedName.slice(1);
        }

        return normalizedName;
    };

    const resolveIconName = (lookupKey: string, iconMap: Map<string, string>): string | null => {
        const directMatch = iconMap.get(lookupKey);
        if (directMatch) {
            return directMatch;
        }

        const aliases = extensionAliases.get(lookupKey) ?? [];
        for (const alias of aliases) {
            const aliasMatch = iconMap.get(alias);
            if (aliasMatch) {
                return aliasMatch;
            }
        }

        return null;
    };

    const getMajorityExtension = (folder: Folder): string | null => {
        if (folder.subentries.length === 0) {
            return null;
        }

        if (folder.subentries.some((subentry) => subentry.type === "folder")) {
            return null;
        }

        const extensionCounts = new Map<string, number>();
        for (const subentry of folder.subentries) {
            if (subentry.type !== "file") {
                continue;
            }

            const extension = getFileExtension(subentry.name);
            if (!extension) {
                continue;
            }

            extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + 1);
        }

        if (extensionCounts.size === 0) {
            return null;
        }

        let majorityExtension: string | null = null;
        let majorityCount = -1;

        for (const [extension, count] of extensionCounts) {
            if (
                count > majorityCount ||
                (count === majorityCount && majorityExtension !== null && extension < majorityExtension)
            ) {
                majorityExtension = extension;
                majorityCount = count;
            }
        }

        return majorityExtension;
    };

    const getFileIconName = (entry: File): string | null => {
        const lookupKey = getFileLookupKey(entry.name);
        if (!lookupKey) {
            return null;
        }

        return resolveIconName(lookupKey, fileIconMap);
    };

    const getFolderIconName = (entry: Folder): string | null => {
        const majorityExtension = getMajorityExtension(entry);
        if (!majorityExtension) {
            return null;
        }

        return resolveIconName(majorityExtension, folderIconMap);
    };

    const buildIconPath = (basePath: string, iconFileName: string): string => {
        const normalizedBasePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
        return `${normalizedBasePath}/${iconFileName}`;
    };

    let {
        entry,
        size = 16,
        iconsBasePath
    }: {
        entry: File | Folder;
        size?: number;
        iconsBasePath?: string;
    } = $props();

    const resolvedIconFileName = $derived.by(() => {
        if (entry.type === "file") {
            return getFileIconName(entry);
        }

        return getFolderIconName(entry);
    });

    const resolvedIconPath = $derived.by(() => {
        if (!resolvedIconFileName) {
            return null;
        }

        if (!iconsBasePath) {
            return packagedIconUrlMap.get(resolvedIconFileName) ?? null;
        }

        return buildIconPath(iconsBasePath, resolvedIconFileName);
    });
</script>

{#if resolvedIconPath}
    <img class="tree-entry-icon" src={resolvedIconPath} alt="" width={size} height={size} loading="lazy" />
{:else if entry.type === "file"}
    <Icon icon="fa6-solid:file" width={size} height={size} />
{:else}
    <Icon icon="fa6-solid:folder" width={size} height={size} />
{/if}

<style>
    .tree-entry-icon {
        display: inline-block;
        flex: 0 0 auto;
        object-fit: contain;
        vertical-align: middle;
    }
</style>
