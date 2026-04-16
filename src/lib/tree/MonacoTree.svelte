<script lang="ts" module>
    import type { Snippet } from "svelte";
    import type { File, Folder, Project } from "./types.ts";

    export type ProjectContextMenuAction =
        | "toggle-project"
        | "new-file"
        | "new-folder"
        | "new-project"
        | "rename-project"
        | "delete-project"
        | "refresh";
    export type FileContextMenuAction =
        | "select-file"
        | "unselect-file"
        | "new-file"
        | "new-folder"
        | "rename-file"
        | "delete-file"
        | "refresh";
    export type FolderContextMenuAction =
        | "toggle-folder"
        | "new-file"
        | "new-folder"
        | "rename-folder"
        | "delete-folder"
        | "refresh";
    export type EmptyTrayContextMenuAction = "add-new-project";

    export interface ProjectContextMenuSnippetProps {
        x: number;
        y: number;
        projectId: string;
        project: Project;
        closeMenu: () => void;
        runDefaultAction: (action: ProjectContextMenuAction) => Promise<void>;
    }

    export interface FileContextMenuSnippetProps {
        x: number;
        y: number;
        projectId: string;
        file: File;
        closeMenu: () => void;
        runDefaultAction: (action: FileContextMenuAction) => Promise<void>;
    }

    export interface FolderContextMenuSnippetProps {
        x: number;
        y: number;
        projectId: string;
        folder: Folder;
        closeMenu: () => void;
        runDefaultAction: (action: FolderContextMenuAction) => Promise<void>;
    }

    export interface EmptyTrayContextMenuSnippetProps {
        x: number;
        y: number;
        closeMenu: () => void;
        runDefaultAction: (action: EmptyTrayContextMenuAction) => Promise<void>;
    }

    export interface CreateEntityContext {
        project: Project;
        parentFolder: Folder | null;
    }

    export interface CreatedEntryLocationContext {
        project: Project;
        parentFolder: Folder | null;
        folderPath: Folder[];
    }

    export interface Props {
        treeName: string;
        nameStripeButtons?: {
            newFile: boolean;
            newFolder: boolean;
            newProject: boolean;
            refresh: boolean;
        };
        stripeButtonTitle?: Record<keyof NonNullable<Props["nameStripeButtons"]>, string>;
        oneFileSelected?: boolean;
        clickToUnselectFile?: boolean;
        showIcons?: boolean;
        showSelectedProject?: boolean;
        projects: Project[];
        onToggleEntry?: (entry: File | Folder) => void | Promise<void>;
        onToggleProject?: (project: Project) => void | Promise<void>;
        onNewFile?: (context?: CreateEntityContext) => Promise<void> | void;
        onNewFolder?: (context?: CreateEntityContext) => Promise<void> | void;
        onFileCreated?: (file: File, context: CreatedEntryLocationContext) => Promise<void> | void;
        onFolderCreated?: (folder: Folder, context: CreatedEntryLocationContext) => Promise<void> | void;
        onNewProject?: () => Promise<void> | void;
        onRefreshTreeView?: () => Promise<void> | void;
        onRenameFile?: (file: File) => Promise<void> | void;
        onRenameFolder?: (folder: Folder) => Promise<void> | void;
        onRenameProject?: (project: Project) => Promise<void> | void;
        onRenamedFile?: (previousFile: File, newName: string) => Promise<void> | void;
        onRenamedFolder?: (previousFolder: Folder, newName: string) => Promise<void> | void;
        onRenamedProject?: (previousProject: Project, newName: string) => Promise<void> | void;
        onDeleteFile?: (file: File) => Promise<void> | void;
        onDeletedFile?: (file: File) => Promise<void> | void;
        onDeleteFolder?: (folder: Folder) => Promise<void> | void;
        onDeletedFolder?: (folder: Folder) => Promise<void> | void;
        onDeleteProject?: (project: Project) => Promise<void> | void;
        onDeletedProject?: (project: Project) => Promise<void> | void;
        onLocationChanged?: (previousEntry: File | Folder, nextEntry: File | Folder) => Promise<void> | void;
        onProjectContextAction?: (action: ProjectContextMenuAction, project: Project) => void | Promise<void>;
        onFileContextAction?: (action: FileContextMenuAction, file: File) => void | Promise<void>;
        onFolderContextAction?: (action: FolderContextMenuAction, folder: Folder) => void | Promise<void>;
        onProjectAddition?: () => Promise<void> | void;
        onProjectCreated?: (project: Project) => Promise<void> | void;
        projectContextMenu?: Snippet<[ProjectContextMenuSnippetProps]>;
        fileContextMenu?: Snippet<[FileContextMenuSnippetProps]>;
        folderContextMenu?: Snippet<[FolderContextMenuSnippetProps]>;
        emptyTrayContextMenu?: Snippet<[EmptyTrayContextMenuSnippetProps]>;
        CustomProjectElement?: Snippet<[Project]>;
        CustomFileElement?: Snippet<[File]>;
        CustomFolderElement?: Snippet<[Folder]>;
        version?: "mobile" | "desktop";
        noProjectContainer?: Snippet;
    }
</script>

<script lang="ts">
    import Entry from "./Entry.svelte";
    import EntryNameEditor from "./EntryNameEditor.svelte";
    import MonacoContextMenu, { type ContextMenuItem as ContextMenuOption } from "../contextmenu/MonacoContextMenu.svelte";
    import Icon from "./IconifyOffline.svelte";
    import { activeContextMenu, openFileIds, openFolderIds, openProjectIds, openProjects } from "./store.ts";

    type TreeEntry = File | Folder;
    type ButtonName = keyof NonNullable<Props["nameStripeButtons"]>;

    type CreateTarget = {
        projectId: string;
        folderId: string | null;
    };

    type PendingCreateState =
        | {
            kind: "project";
        }
        | {
            kind: "file" | "folder";
            target: CreateTarget;
        };

    type PendingRenameState =
        | {
            kind: "project";
            projectId: string;
        }
        | {
            kind: "file" | "folder";
            projectId: string;
            entryId: string;
        };

    interface NestedRenameState {
        projectId: string;
        entryId: string;
        kind: "file" | "folder";
    }

    interface NestedCreateState {
        projectId: string;
        folderId: string | null;
        kind: "file" | "folder";
    }

    interface DragState {
        projectId: string;
        entryId: string;
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

    interface EntryLocation {
        projectIndex: number;
        project: Project;
        container: TreeEntry[];
        index: number;
        entry: TreeEntry;
        parentFolder: Folder | null;
    }

    const defaultProjectMenuItems: ContextMenuOption[] = [
        { id: "toggle-project", label: "Toggle Project" },
        { id: "new-file", label: "New File" },
        { id: "new-folder", label: "New Folder" },
        { id: "new-project", label: "New Project" },
        { id: "rename-project", label: "Rename Project" },
        { id: "delete-project", label: "Delete Project", danger: true },
        { id: "refresh", label: "Refresh" }
    ];

    const defaultFileMenuItems: ContextMenuOption[] = [
        { id: "select-file", label: "Select File" },
        { id: "new-file", label: "New File" },
        { id: "new-folder", label: "New Folder" },
        { id: "rename-file", label: "Rename File" },
        { id: "delete-file", label: "Delete File", danger: true },
        { id: "refresh", label: "Refresh" }
    ];

    const defaultFolderMenuItems: ContextMenuOption[] = [
        { id: "toggle-folder", label: "Toggle Folder" },
        { id: "new-file", label: "New File" },
        { id: "new-folder", label: "New Folder" },
        { id: "rename-folder", label: "Rename Folder" },
        { id: "delete-folder", label: "Delete Folder", danger: true },
        { id: "refresh", label: "Refresh" }
    ];

    const defaultEmptyTrayMenuItems: ContextMenuOption[] = [{ id: "add-new-project", label: "Add New Project" }];

    const buttonIcons: Record<ButtonName, string> = {
        newFile: "material-symbols:note-add-outline-rounded",
        newFolder: "material-symbols:create-new-folder-outline-rounded",
        newProject: "material-symbols:code-blocks-outline-rounded",
        refresh: "material-symbols:refresh-rounded"
    };

    let {
        treeName,
        nameStripeButtons = {
            newFile: true,
            newFolder: true,
            newProject: true,
            refresh: true
        },
        stripeButtonTitle = {
            newFile: "New File",
            newFolder: "New Folder",
            newProject: "New Project",
            refresh: "Refresh"
        },
        showSelectedProject = true,
        oneFileSelected = true,
        clickToUnselectFile = true,
        projects = $bindable([] as Project[]),
        showIcons = true,
        version = "desktop",
        onToggleEntry = () => {},
        onToggleProject = () => {},
        onNewFile = () => {},
        onNewFolder = () => {},
        onFileCreated,
        onFolderCreated,
        onNewProject = () => {},
        onRefreshTreeView = () => {},
        onRenameFile,
        onRenameFolder,
        onRenameProject,
        onRenamedFile,
        onRenamedFolder,
        onRenamedProject,
        onDeleteFile,
        onDeletedFile,
        onDeleteFolder,
        onDeletedFolder,
        onDeleteProject,
        onDeletedProject,
        onLocationChanged,
        onProjectContextAction,
        onFileContextAction,
        onFolderContextAction,
        onProjectAddition,
        onProjectCreated,
        projectContextMenu,
        fileContextMenu,
        folderContextMenu,
        emptyTrayContextMenu,
        CustomProjectElement,
        CustomFileElement,
        CustomFolderElement,
        noProjectContainer
    }: Props = $props();

    let pendingCreate = $state<PendingCreateState | null>(null);
    let pendingRename = $state<PendingRenameState | null>(null);
    let dragState = $state<DragState | null>(null);
    let activeDropTarget = $state<DropTarget | null>(null);
    let selectedProjectId = $state<string | null>(null);
    let pendingProjectName = $state("");

    let nestedRenameState = $derived.by((): NestedRenameState | null => {
        if (!pendingRename || pendingRename.kind === "project") {
            return null;
        }

        return pendingRename;
    });

    let nestedCreateState = $derived.by((): NestedCreateState | null => {
        if (!pendingCreate || pendingCreate.kind === "project") {
            return null;
        }

        return {
            kind: pendingCreate.kind,
            projectId: pendingCreate.target.projectId,
            folderId: pendingCreate.target.folderId
        };
    });

    $effect(() => {
        projects;
        showIcons;
        version;
        $openProjects = projects;
    });

    $effect(() => {
        if (!projects.length) {
            selectedProjectId = null;
            return;
        }

        if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
            selectedProjectId = projects[0].id;
        }
    });

    function createId(prefix: string): string {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
            return `${prefix}-${crypto.randomUUID()}`;
        }

        return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
    }

    function cloneEntry(entry: TreeEntry): TreeEntry {
        if (entry.type === "file") {
            return { ...entry };
        }

        return {
            ...entry,
            subentries: entry.subentries.map((subentry) => cloneEntry(subentry))
        };
    }

    function cloneProject(project: Project): Project {
        return {
            ...project,
            entries: project.entries.map((entry) => cloneEntry(entry))
        };
    }

    function cloneProjects(items: Project[]): Project[] {
        return items.map((project) => cloneProject(project));
    }

    function sortEntries(entries: TreeEntry[]) {
        return [...entries].sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === "folder" ? -1 : 1;
            }

            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        });
    }

    function removeId(list: string[], id: string): string[] {
        const index = list.findIndex((listId) => listId === id);
        if (index === -1) {
            return list;
        }

        return [...list.slice(0, index), ...list.slice(index + 1)];
    }

    function addUniqueId(list: string[], id: string): string[] {
        if (list.includes(id)) {
            return list;
        }

        return [...list, id];
    }

    function setProjects(nextProjects: Project[]) {
        projects = nextProjects;
        $openProjects = nextProjects;
    }

    function getProjectIndexById(items: Project[], projectId: string): number {
        return items.findIndex((project) => project.id === projectId);
    }

    function findEntryInEntries(
        entries: TreeEntry[],
        entryId: string,
        project: Project,
        projectIndex: number,
        parentFolder: Folder | null
    ): EntryLocation | null {
        for (let index = 0; index < entries.length; index += 1) {
            const entry = entries[index];
            if (entry.id === entryId) {
                return {
                    project,
                    projectIndex,
                    container: entries,
                    index,
                    entry,
                    parentFolder
                };
            }

            if (entry.type === "folder") {
                const nested = findEntryInEntries(entry.subentries, entryId, project, projectIndex, entry);
                if (nested) {
                    return nested;
                }
            }
        }

        return null;
    }

    function findEntryLocation(items: Project[], projectId: string, entryId: string): EntryLocation | null {
        const projectIndex = getProjectIndexById(items, projectId);
        if (projectIndex === -1) {
            return null;
        }

        const project = items[projectIndex];
        return findEntryInEntries(project.entries, entryId, project, projectIndex, null);
    }

    function findFolderPathInEntries(entries: TreeEntry[], folderId: string, parentPath: string[]): string[] | null {
        for (const entry of entries) {
            if (entry.type !== "folder") {
                continue;
            }

            const nextPath = [...parentPath, entry.id];
            if (entry.id === folderId) {
                return nextPath;
            }

            const nestedPath = findFolderPathInEntries(entry.subentries, folderId, nextPath);
            if (nestedPath) {
                return nestedPath;
            }
        }

        return null;
    }

    function getFolderPath(project: Project, folderId: string): string[] | null {
        return findFolderPathInEntries(project.entries, folderId, []);
    }

    function findProjectById(items: Project[], projectId: string): { project: Project; projectIndex: number } | null {
        const projectIndex = getProjectIndexById(items, projectId);
        if (projectIndex === -1) {
            return null;
        }

        return {
            project: items[projectIndex],
            projectIndex
        };
    }

    function getCreateContainer(
        items: Project[],
        target: CreateTarget
    ): { project: Project; projectIndex: number; container: TreeEntry[]; parentFolder: Folder | null } | null {
        const projectData = findProjectById(items, target.projectId);
        if (!projectData) {
            return null;
        }

        if (target.folderId === null) {
            return {
                ...projectData,
                container: projectData.project.entries,
                parentFolder: null
            };
        }

        const folderLocation = findEntryLocation(items, target.projectId, target.folderId);
        if (!folderLocation || folderLocation.entry.type !== "folder") {
            return null;
        }

        return {
            ...projectData,
            container: folderLocation.entry.subentries,
            parentFolder: folderLocation.entry
        };
    }

    function collectEntryIds(entry: TreeEntry): { fileIds: string[]; folderIds: string[] } {
        if (entry.type === "file") {
            return {
                fileIds: [entry.id],
                folderIds: []
            };
        }

        const fileIds: string[] = [];
        const folderIds: string[] = [entry.id];

        for (const subentry of entry.subentries) {
            const subIds = collectEntryIds(subentry);
            fileIds.push(...subIds.fileIds);
            folderIds.push(...subIds.folderIds);
        }

        return {
            fileIds,
            folderIds
        };
    }

    function collectProjectEntryIds(entries: TreeEntry[]): { fileIds: string[]; folderIds: string[] } {
        const fileIds: string[] = [];
        const folderIds: string[] = [];

        for (const entry of entries) {
            const entryIds = collectEntryIds(entry);
            fileIds.push(...entryIds.fileIds);
            folderIds.push(...entryIds.folderIds);
        }

        return {
            fileIds,
            folderIds
        };
    }

    function folderContainsEntry(folder: Folder, entryId: string): boolean {
        for (const subentry of folder.subentries) {
            if (subentry.id === entryId) {
                return true;
            }

            if (subentry.type === "folder" && folderContainsEntry(subentry, entryId)) {
                return true;
            }
        }

        return false;
    }

    function closeContextMenu() {
        $activeContextMenu = null;
    }

    function clearDropTarget() {
        activeDropTarget = null;
    }

    function matchesDropTarget(target: DropTarget, currentTarget: DropTarget | null): boolean {
        if (!currentTarget || target.kind !== currentTarget.kind) {
            return false;
        }

        if (target.kind === "project" && currentTarget.kind === "project") {
            return target.projectId === currentTarget.projectId;
        }

        if (target.kind === "folder" && currentTarget.kind === "folder") {
            return target.projectId === currentTarget.projectId && target.folderId === currentTarget.folderId;
        }

        return false;
    }

    function isProjectDropTarget(projectId: string): boolean {
        return activeDropTarget?.kind === "project" && activeDropTarget.projectId === projectId;
    }

    function cancelInlineEdit() {
        pendingCreate = null;
        pendingRename = null;
    }

    function toggleProjectOpen(project: Project) {
        selectedProjectId = project.id;

        if ($openProjectIds.includes(project.id)) {
            $openProjectIds = removeId($openProjectIds, project.id);
        }
        else {
            $openProjectIds = [...$openProjectIds, project.id];
        }

        onToggleProject(project);
    }

    function toggleFolderOpen(folder: Folder, projectId: string) {
        selectedProjectId = projectId;

        if ($openFolderIds.includes(folder.id)) {
            $openFolderIds = removeId($openFolderIds, folder.id);
        }
        else {
            $openFolderIds = [...$openFolderIds, folder.id];
        }

        onToggleEntry(folder);
    }

    function selectFile(file: File, projectId: string) {
        selectedProjectId = projectId;

        if ($openFileIds.includes(file.id)) {
            return;
        }

        if (oneFileSelected) {
            $openFileIds = [file.id];
        }
        else {
            $openFileIds = [...$openFileIds, file.id];
        }

        onToggleEntry(file);
    }

    function unselectFile(file: File, projectId: string) {
        selectedProjectId = projectId;

        if (!$openFileIds.includes(file.id)) {
            return;
        }

        $openFileIds = removeId($openFileIds, file.id);
        onToggleEntry(file);
    }

    function projectMenuItems(project: Project): ContextMenuOption[] {
        return defaultProjectMenuItems.map((menuItem) => {
            if (menuItem.id !== "toggle-project") {
                return menuItem;
            }

            return {
                ...menuItem,
                label: $openProjectIds.includes(project.id) ? "Collapse Project" : "Expand Project"
            };
        });
    }

    function fileMenuItems(file: File): ContextMenuOption[] {
        const fileIsSelected = $openFileIds.includes(file.id);

        return defaultFileMenuItems.map((menuItem) => {
            if (menuItem.id !== "select-file") {
                return menuItem;
            }

            return {
                ...menuItem,
                id: fileIsSelected ? "unselect-file" : "select-file",
                label: fileIsSelected ? "Unselect File" : "Select File"
            };
        });
    }

    function folderMenuItems(folder: Folder): ContextMenuOption[] {
        return defaultFolderMenuItems.map((menuItem) => {
            if (menuItem.id !== "toggle-folder") {
                return menuItem;
            }

            return {
                ...menuItem,
                label: $openFolderIds.includes(folder.id) ? "Collapse Folder" : "Expand Folder"
            };
        });
    }

    function emptyTrayMenuItems(): ContextMenuOption[] {
        return defaultEmptyTrayMenuItems.map((menuItem) => ({
            ...menuItem,
            disabled: pendingCreate?.kind === "project"
        }));
    }

    function resolveCreateContext(target: CreateTarget): CreateEntityContext | null {
        const projectData = findProjectById(projects, target.projectId);
        if (!projectData) {
            return null;
        }

        if (target.folderId === null) {
            return {
                project: projectData.project,
                parentFolder: null
            };
        }

        const folderLocation = findEntryLocation(projects, target.projectId, target.folderId);
        if (!folderLocation || folderLocation.entry.type !== "folder") {
            return null;
        }

        return {
            project: projectData.project,
            parentFolder: folderLocation.entry
        };
    }

    function resolveEntryParentTarget(projectId: string, entry: TreeEntry): CreateTarget | null {
        if (entry.type === "folder") {
            return {
                projectId,
                folderId: entry.id
            };
        }

        const location = findEntryLocation(projects, projectId, entry.id);
        if (!location) {
            return null;
        }

        return {
            projectId,
            folderId: location.parentFolder ? location.parentFolder.id : null
        };
    }

    function resolveCreatedEntryLocationContext(items: Project[], target: CreateTarget): CreatedEntryLocationContext | null {
        const projectData = findProjectById(items, target.projectId);
        if (!projectData) {
            return null;
        }

        if (target.folderId === null) {
            return {
                project: projectData.project,
                parentFolder: null,
                folderPath: []
            };
        }

        const parentFolderLocation = findEntryLocation(items, target.projectId, target.folderId);
        if (!parentFolderLocation || parentFolderLocation.entry.type !== "folder") {
            return null;
        }

        const folderPathIds = getFolderPath(projectData.project, target.folderId) ?? [target.folderId];
        const folderPath: Folder[] = folderPathIds
            .map((folderId) => {
                const location = findEntryLocation(items, target.projectId, folderId);
                if (!location || location.entry.type !== "folder") {
                    return null;
                }

                return location.entry;
            })
            .filter((folder): folder is Folder => folder !== null);

        return {
            project: projectData.project,
            parentFolder: parentFolderLocation.entry,
            folderPath
        };
    }

    function ensureCreateTargetVisible(target: CreateTarget) {
        $openProjectIds = addUniqueId($openProjectIds, target.projectId);

        if (target.folderId === null) {
            return;
        }

        const projectData = findProjectById(projects, target.projectId);
        if (!projectData) {
            $openFolderIds = addUniqueId($openFolderIds, target.folderId);
            return;
        }

        const folderPath = getFolderPath(projectData.project, target.folderId);
        if (!folderPath) {
            $openFolderIds = addUniqueId($openFolderIds, target.folderId);
            return;
        }

        let nextOpenFolderIds = $openFolderIds;
        for (const folderId of folderPath) {
            nextOpenFolderIds = addUniqueId(nextOpenFolderIds, folderId);
        }

        $openFolderIds = nextOpenFolderIds;
    }

    function resolveDefaultCreateTarget(): CreateTarget | null {
        if ($activeContextMenu?.kind === "project") {
            return {
                projectId: $activeContextMenu.projectId,
                folderId: null
            };
        }

        if ($activeContextMenu?.kind === "folder") {
            return {
                projectId: $activeContextMenu.projectId,
                folderId: $activeContextMenu.folder.id
            };
        }

        if ($activeContextMenu?.kind === "file") {
            return resolveEntryParentTarget($activeContextMenu.projectId, $activeContextMenu.file);
        }

        const fallbackProjectId = selectedProjectId ?? $openProjectIds.at(-1) ?? projects[0]?.id;
        if (!fallbackProjectId) {
            return null;
        }

        return {
            projectId: fallbackProjectId,
            folderId: null
        };
    }

    async function startCreate(kind: "file" | "folder", target: CreateTarget) {
        selectedProjectId = target.projectId;

        const context = resolveCreateContext(target);
        if (!context) {
            return;
        }

        if (kind === "file") {
            await onNewFile(context);
        }
        else {
            await onNewFolder(context);
        }

        pendingRename = null;
        pendingCreate = {
            kind,
            target
        };

        ensureCreateTargetVisible(target);
    }

    async function startCreateProject() {
        await onNewProject();
        await onProjectAddition?.();
        pendingRename = null;
        pendingProjectName = "";
        pendingCreate = {
            kind: "project"
        };
    }

    async function applyCreate(name: string) {
        const createState = pendingCreate;
        if (!createState) {
            return;
        }

        if (createState.kind === "project") {
            const nextProjectName = name.trim();
            if (!nextProjectName) {
                return;
            }

            const nextProject: Project = {
                id: createId("project"),
                name: nextProjectName,
                entries: []
            };

            setProjects([...cloneProjects(projects), nextProject]);
            $openProjectIds = [...$openProjectIds, nextProject.id];
            pendingCreate = null;
            pendingProjectName = "";
            await onProjectCreated?.(nextProject);
            return;
        }

        const nextProjects = cloneProjects(projects);
        const createContainer = getCreateContainer(nextProjects, createState.target);
        if (!createContainer) {
            pendingCreate = null;
            return;
        }

        const newEntry: TreeEntry =
            createState.kind === "file"
                ? {
                    id: createId("file"),
                    type: "file",
                    name
                }
                : {
                    id: createId("folder"),
                    type: "folder",
                    name,
                    subentries: []
                };

        createContainer.container.unshift(newEntry);

        const createdEntryLocationContext = resolveCreatedEntryLocationContext(nextProjects, createState.target);
        setProjects(nextProjects);
        pendingCreate = null;

        if (!createdEntryLocationContext) {
            return;
        }

        if (newEntry.type === "file") {
            await onFileCreated?.(newEntry, createdEntryLocationContext);
        }
        else {
            await onFolderCreated?.(newEntry, createdEntryLocationContext);
        }
    }

    function cancelProjectCreation() {
        cancelInlineEdit();
        pendingProjectName = "";
    }

    async function confirmProjectCreation() {
        await applyCreate(pendingProjectName);
    }

    function onProjectCreationInputKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            void confirmProjectCreation();
        }
        else if (event.key === "Escape") {
            event.preventDefault();
            cancelProjectCreation();
        }
    }

    async function beginRenameProject(project: Project) {
        await onRenameProject?.(project);
        pendingCreate = null;
        pendingRename = {
            kind: "project",
            projectId: project.id
        };
    }

    async function beginRenameEntry(entry: TreeEntry, projectId: string) {
        if (entry.type === "file") {
            await onRenameFile?.(entry);
        }
        else {
            await onRenameFolder?.(entry);
        }

        pendingCreate = null;
        pendingRename = {
            kind: entry.type,
            projectId,
            entryId: entry.id
        };
    }

    async function applyProjectRename(projectId: string, nextName: string) {
        const nextProjects = cloneProjects(projects);
        const projectData = findProjectById(nextProjects, projectId);
        if (!projectData) {
            pendingRename = null;
            return;
        }

        const previousProject = cloneProject(projectData.project);
        projectData.project.name = nextName;

        setProjects(nextProjects);
        pendingRename = null;
        await onRenamedProject?.(previousProject, nextName);
    }

    async function applyEntryRename(entry: TreeEntry, projectId: string, nextName: string) {
        const nextProjects = cloneProjects(projects);
        const location = findEntryLocation(nextProjects, projectId, entry.id);
        if (!location) {
            pendingRename = null;
            return;
        }

        const previousEntry = cloneEntry(location.entry);
        location.entry.name = nextName;

        setProjects(nextProjects);
        pendingRename = null;

        if (previousEntry.type === "file") {
            await onRenamedFile?.(previousEntry, nextName);
        }
        else {
            await onRenamedFolder?.(previousEntry, nextName);
        }
    }

    async function deleteProject(project: Project) {
        await onDeleteProject?.(project);

        const nextProjects = cloneProjects(projects);
        const projectData = findProjectById(nextProjects, project.id);
        if (!projectData) {
            return;
        }

        const [removedProject] = nextProjects.splice(projectData.projectIndex, 1);
        if (!removedProject) {
            return;
        }

        const removedIds = collectProjectEntryIds(removedProject.entries);
        const removedFolderIds = new Set(removedIds.folderIds);
        const removedFileIds = new Set(removedIds.fileIds);

        $openProjectIds = removeId($openProjectIds, removedProject.id);
        $openFolderIds = $openFolderIds.filter((folderId) => !removedFolderIds.has(folderId));
        $openFileIds = $openFileIds.filter((fileId) => !removedFileIds.has(fileId));

        setProjects(nextProjects);
        await onDeletedProject?.(removedProject);
    }

    async function deleteEntry(entry: TreeEntry, projectId: string) {
        if (entry.type === "file") {
            await onDeleteFile?.(entry);
        }
        else {
            await onDeleteFolder?.(entry);
        }

        const nextProjects = cloneProjects(projects);
        const location = findEntryLocation(nextProjects, projectId, entry.id);
        if (!location) {
            return;
        }

        const [removedEntry] = location.container.splice(location.index, 1);
        if (!removedEntry) {
            return;
        }

        if (removedEntry.type === "file") {
            $openFileIds = removeId($openFileIds, removedEntry.id);
            setProjects(nextProjects);
            await onDeletedFile?.(removedEntry);
            return;
        }

        const removedIds = collectEntryIds(removedEntry);
        const removedFolderIds = new Set(removedIds.folderIds);
        const removedFileIds = new Set(removedIds.fileIds);

        $openFolderIds = $openFolderIds.filter((folderId) => !removedFolderIds.has(folderId));
        $openFileIds = $openFileIds.filter((fileId) => !removedFileIds.has(fileId));

        setProjects(nextProjects);
        await onDeletedFolder?.(removedEntry);
    }

    async function moveDraggedEntry(target: CreateTarget) {
        const dragInfo = dragState;
        if (!dragInfo) {
            return;
        }

        const nextProjects = cloneProjects(projects);
        const sourceLocation = findEntryLocation(nextProjects, dragInfo.projectId, dragInfo.entryId);
        if (!sourceLocation) {
            dragState = null;
            return;
        }

        const sourceContainerId = sourceLocation.parentFolder ? sourceLocation.parentFolder.id : `project:${sourceLocation.project.id}`;
        const targetContainerId = target.folderId ? target.folderId : `project:${target.projectId}`;

        if (sourceContainerId === targetContainerId && sourceLocation.index === 0) {
            dragState = null;
            return;
        }

        if (sourceLocation.entry.type === "folder" && target.folderId !== null) {
            if (sourceLocation.entry.id === target.folderId || folderContainsEntry(sourceLocation.entry, target.folderId)) {
                dragState = null;
                return;
            }
        }

        const previousEntry = cloneEntry(sourceLocation.entry);
        const [movedEntry] = sourceLocation.container.splice(sourceLocation.index, 1);
        if (!movedEntry) {
            dragState = null;
            return;
        }

        const targetContainer = getCreateContainer(nextProjects, target);
        if (!targetContainer) {
            dragState = null;
            return;
        }

        targetContainer.container.unshift(movedEntry);

        if (target.folderId !== null && !$openFolderIds.includes(target.folderId)) {
            $openFolderIds = [...$openFolderIds, target.folderId];
        }

        setProjects(nextProjects);

        const updatedLocation = findEntryLocation(nextProjects, target.projectId, movedEntry.id);
        const nextEntry = updatedLocation ? cloneEntry(updatedLocation.entry) : cloneEntry(movedEntry);

        dragState = null;
        await onLocationChanged?.(previousEntry, nextEntry);
    }

    async function runProjectDefaultAction(action: ProjectContextMenuAction, project: Project, projectId: string) {
        if (action === "toggle-project") {
            toggleProjectOpen(project);
        }
        else if (action === "new-file") {
            await startCreate("file", { projectId, folderId: null });
        }
        else if (action === "new-folder") {
            await startCreate("folder", { projectId, folderId: null });
        }
        else if (action === "new-project") {
            await startCreateProject();
        }
        else if (action === "rename-project") {
            await beginRenameProject(project);
        }
        else if (action === "delete-project") {
            await deleteProject(project);
        }
        else if (action === "refresh") {
            await onRefreshTreeView();
        }

        await onProjectContextAction?.(action, project);
    }

    async function runFileDefaultAction(action: FileContextMenuAction, file: File, projectId: string) {
        if (action === "select-file") {
            selectFile(file, projectId);
        }
        else if (action === "unselect-file") {
            unselectFile(file, projectId);
        }
        else if (action === "new-file") {
            const target = resolveEntryParentTarget(projectId, file);
            if (target) {
                await startCreate("file", target);
            }
        }
        else if (action === "new-folder") {
            const target = resolveEntryParentTarget(projectId, file);
            if (target) {
                await startCreate("folder", target);
            }
        }
        else if (action === "rename-file") {
            await beginRenameEntry(file, projectId);
        }
        else if (action === "delete-file") {
            await deleteEntry(file, projectId);
        }
        else if (action === "refresh") {
            await onRefreshTreeView();
        }

        await onFileContextAction?.(action, file);
    }

    async function runFolderDefaultAction(action: FolderContextMenuAction, folder: Folder, projectId: string) {
        if (action === "toggle-folder") {
            toggleFolderOpen(folder, projectId);
        }
        else if (action === "new-file") {
            await startCreate("file", { projectId, folderId: folder.id });
        }
        else if (action === "new-folder") {
            await startCreate("folder", { projectId, folderId: folder.id });
        }
        else if (action === "rename-folder") {
            await beginRenameEntry(folder, projectId);
        }
        else if (action === "delete-folder") {
            await deleteEntry(folder, projectId);
        }
        else if (action === "refresh") {
            await onRefreshTreeView();
        }

        await onFolderContextAction?.(action, folder);
    }

    async function onProjectMenuAction(itemId: string, project: Project, projectId: string) {
        await runProjectDefaultAction(itemId as ProjectContextMenuAction, project, projectId);
        closeContextMenu();
    }

    async function onFileMenuAction(itemId: string, file: File, projectId: string) {
        await runFileDefaultAction(itemId as FileContextMenuAction, file, projectId);
        closeContextMenu();
    }

    async function onFolderMenuAction(itemId: string, folder: Folder, projectId: string) {
        await runFolderDefaultAction(itemId as FolderContextMenuAction, folder, projectId);
        closeContextMenu();
    }

    async function runEmptyTrayDefaultAction(action: EmptyTrayContextMenuAction) {
        if (action === "add-new-project") {
            await startCreateProject();
        }
    }

    async function onEmptyTrayMenuAction(itemId: string) {
        await runEmptyTrayDefaultAction(itemId as EmptyTrayContextMenuAction);
        closeContextMenu();
    }

    function onProjectContextMenu(project: Project) {
        return (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            selectedProjectId = project.id;

            $activeContextMenu = {
                kind: "project",
                x: event.clientX,
                y: event.clientY,
                projectId: project.id,
                project
            };
        };
    }

    function isProjectContextMenuOpen(project: Project) {
        return $activeContextMenu?.kind === "project" && $activeContextMenu.project.id === project.id;
    }

    function onEntryContextMenu(event: MouseEvent, entry: TreeEntry, projectId: string) {
        event.preventDefault();
        event.stopPropagation();

        selectedProjectId = projectId;

        if (entry.type === "file") {
            $activeContextMenu = {
                kind: "file",
                x: event.clientX,
                y: event.clientY,
                projectId,
                file: entry
            };

            return;
        }

        $activeContextMenu = {
            kind: "folder",
            x: event.clientX,
            y: event.clientY,
            projectId,
            folder: entry
        };
    }

    function onEmptyTrayContextMenu(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        $activeContextMenu = {
            kind: "empty-tray",
            x: event.clientX,
            y: event.clientY
        };
    }

    function onProjectDragOver(event: DragEvent, projectId: string) {
        event.preventDefault();
        event.stopPropagation();

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
        }

        if (!dragState) {
            return;
        }

        selectedProjectId = projectId;

        activeDropTarget = {
            kind: "project",
            projectId
        };
    }

    function onFolderDragOver(event: DragEvent, folderId: string, projectId: string) {
        event.preventDefault();
        event.stopPropagation();

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
        }

        if (!dragState) {
            return;
        }

        selectedProjectId = projectId;

        activeDropTarget = {
            kind: "folder",
            projectId,
            folderId
        };
    }

    function onDropTargetDragLeave(event: DragEvent, target: DropTarget) {
        event.stopPropagation();

        if (!matchesDropTarget(target, activeDropTarget)) {
            return;
        }

        const currentTarget = event.currentTarget;
        const nextTarget = event.relatedTarget;

        // WebView2 may report null relatedTarget while still dragging within the tree.
        // Keep highlight until a new dragover, drop, or dragend arrives.
        if (nextTarget === null) {
            return;
        }

        if (currentTarget instanceof Node && nextTarget instanceof Node && currentTarget.contains(nextTarget)) {
            return;
        }

        clearDropTarget();
    }

    function onEntryDragStart(event: DragEvent, entry: TreeEntry, projectId: string) {
        event.stopPropagation();

        clearDropTarget();

        selectedProjectId = projectId;

        dragState = {
            projectId,
            entryId: entry.id
        };

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", `${projectId}:${entry.id}`);
            event.dataTransfer.setData("application/x-monaco-tree-entry", JSON.stringify({ projectId, entryId: entry.id }));
        }
    }

    function onEntryDragEnd() {
        dragState = null;
        clearDropTarget();
    }

    async function onFolderDrop(event: DragEvent, folder: Folder, projectId: string) {
        event.preventDefault();
        event.stopPropagation();
        clearDropTarget();

        await moveDraggedEntry({
            projectId,
            folderId: folder.id
        });
    }

    async function onProjectRootDrop(event: DragEvent, project: Project) {
        event.preventDefault();
        event.stopPropagation();
        clearDropTarget();

        selectedProjectId = project.id;

        await moveDraggedEntry({
            projectId: project.id,
            folderId: null
        });
    }

    function onToggleProjectHandle(project: Project) {
        return () => {
            toggleProjectOpen(project);
        };
    }

    function onToggleEntryForProject(projectId: string) {
        return (entry: TreeEntry) => {
            selectedProjectId = projectId;
            onToggleEntry(entry);
        };
    }

    async function onStripeButtonClick(buttonName: ButtonName) {
        if (buttonName === "refresh") {
            await onRefreshTreeView();
            return;
        }

        if (buttonName === "newProject") {
            await startCreateProject();
            return;
        }

        const target = resolveDefaultCreateTarget();
        if (!target) {
            return;
        }

        if (buttonName === "newFile") {
            await startCreate("file", target);
            return;
        }

        if (buttonName === "newFolder") {
            await startCreate("folder", target);
        }
    }

    $effect(() => {
        const currentContextMenu = $activeContextMenu;

        if (!currentContextMenu) {
            return;
        }

        const handleWindowClick = () => {
            $activeContextMenu = null;
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                $activeContextMenu = null;
            }
        };

        window.addEventListener("click", handleWindowClick);
        window.addEventListener("resize", handleWindowClick);
        window.addEventListener("scroll", handleWindowClick, true);
        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("click", handleWindowClick);
            window.removeEventListener("resize", handleWindowClick);
            window.removeEventListener("scroll", handleWindowClick, true);
            window.removeEventListener("keydown", handleEscape);
        };
    });
</script>

<div class="flex flex-col gap-2 w-full h-full p-4">
    <div id="tree-view-heading" class="flex gap-2 items-center justify-between select-none">
        <h3 class="font-bold">{treeName}</h3>

        <div id="buttons" class="flex items-center gap-1">
            {#each (Object.entries(nameStripeButtons) as [ButtonName, boolean][]) as [key, isOn] (key)}
                {#if isOn}
                    <button
                        type="button"
                        title={stripeButtonTitle[key]}
                        class="btn p-1 px-2 btn-ghost inline-flex"
                        onclick={() => void onStripeButtonClick(key)}
                    >
                        <Icon icon={buttonIcons[key]} />
                    </button>
                {/if}
            {/each}
        </div>
    </div>

    <div class="h-full overflow-y-auto overflow-x-auto" role="presentation" oncontextmenu={onEmptyTrayContextMenu}>
        {#if $openProjects.length}
            {#each $openProjects as project (project.id)}
                {@const isProjectOpen = $openProjectIds.includes(project.id)}
                {@const sortedEntries = sortEntries(project.entries)}
                {@const isProjectRenameTarget = pendingRename?.kind === "project" && pendingRename.projectId === project.id}
                {@const shouldShowRootCreateEditor =
                    pendingCreate?.kind !== "project" &&
                    pendingCreate?.target.projectId === project.id &&
                    pendingCreate?.target.folderId === null}

                <div
                    class="w-full"
                    role="presentation"
                    ondragover={(event) => onProjectDragOver(event, project.id)}
                    ondragleave={(event) =>
                        onDropTargetDragLeave(event, {
                            kind: "project",
                            projectId: project.id
                        })}
                    ondrop={(event) => void onProjectRootDrop(event, project)}
                >
                    {#if isProjectRenameTarget}
                        <div class="flex w-full items-center gap-2 rounded-lg bg-gray-500/10 px-1">
                            <div class="flex gap-2 items-center w-full">
                                <Icon icon="material-symbols:code-blocks-outline-rounded" />
                                <EntryNameEditor
                                    kind="project"
                                    initialName={project.name}
                                    placeholder="Project name"
                                    onAccept={async (name) => {
                                        await applyProjectRename(project.id, name);
                                    }}
                                    onCancel={cancelInlineEdit}
                                />
                            </div>
                        </div>
                    {:else}
                        <button
                            class={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border p-1 transition-colors hover:bg-gray-500/5 ${isProjectContextMenuOpen(project) ? 'border-blue-400/90 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.9)]' : 'border-transparent'} ${showSelectedProject && selectedProjectId === project.id ? 'bg-gray-500/15 bg-gray-500/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]' : ''} ${isProjectDropTarget(project.id) ? 'bg-sky-500/20 border-sky-400 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.65)]' : ''}`}
                            onpointerdown={() => {
                                selectedProjectId = project.id;
                            }}
                            onclick={onToggleProjectHandle(project)}
                            oncontextmenu={onProjectContextMenu(project)}
                            ondragover={(event) => onProjectDragOver(event, project.id)}
                            ondragleave={(event) =>
                                onDropTargetDragLeave(event, {
                                    kind: "project",
                                    projectId: project.id
                                })}
                            ondrop={(event) => void onProjectRootDrop(event, project)}
                        >
                            <div class="flex gap-2 items-center">
                                <Icon icon="material-symbols:code-blocks-outline-rounded" />
                                <span class="font-semibold">{project.name}</span>
                            </div>

                            <div class="inline-flex items-center gap-2">
                                {#if CustomProjectElement}
                                    {@render CustomProjectElement(project)}
                                {/if}

                                <div class="btn btn-ghost btn-xs">
                                    <Icon icon={isProjectOpen ? "material-symbols:keyboard-arrow-up-rounded" : "material-symbols:keyboard-arrow-down-rounded"} />
                                </div>
                            </div>
                        </button>
                    {/if}

                    <div class="pl-4">
                        {#if isProjectOpen}
                            {#if shouldShowRootCreateEditor}
                                <div class="flex w-full items-center gap-2 rounded-lg bg-base-content/5 px-1">
                                    <EntryNameEditor
                                        kind={pendingCreate?.kind ?? "file"}
                                        placeholder={pendingCreate?.kind === "folder" ? "New folder name" : "New file name"}
                                        showProgrammingIcon
                                        onAccept={applyCreate}
                                        onCancel={cancelInlineEdit}
                                    />
                                </div>
                            {/if}

                            {#each sortedEntries as entry (entry.id)}
                                <Entry
                                    projectId={project.id}
                                    {clickToUnselectFile}
                                    {oneFileSelected}
                                    {entry}
                                    {CustomFileElement}
                                    {CustomFolderElement}
                                    onToggleEntry={onToggleEntryForProject(project.id)}
                                    {onEntryContextMenu}
                                    renameState={nestedRenameState}
                                    createState={nestedCreateState}
                                    onAcceptRename={applyEntryRename}
                                    onCancelRename={cancelInlineEdit}
                                    onAcceptCreate={applyCreate}
                                    onCancelCreate={cancelInlineEdit}
                                    {onEntryDragStart}
                                    {onEntryDragEnd}
                                    {onFolderDrop}
                                    {onFolderDragOver}
                                    {onDropTargetDragLeave}
                                    {activeDropTarget}
                                />
                            {/each}
                        {/if}
                    </div>
                </div>
            {/each}
        {:else if pendingCreate?.kind !== "project"}
            <div class="flex w-full h-full items-center justify-center select-none">
                {#if noProjectContainer}
                    {@render noProjectContainer()}
                {:else}
                    <p class="text-sm text-base-content/70">No Projects Open</p>
                {/if}
            </div>
        {/if}

        {#if pendingCreate?.kind === "project"}
            <div class="mt-2 w-full">
                <div class="flex w-full items-center gap-2 rounded-lg bg-base-content/5 px-1">
                    <Icon icon="material-symbols:code-blocks-outline-rounded" />

                    <EntryNameEditor
                        kind="project"
                        bind:value={pendingProjectName}
                        placeholder="New project name"
                        onAccept={confirmProjectCreation}
                        onCancel={cancelProjectCreation}
                    />
                </div>
            </div>
        {/if}
    </div>
</div>

{#if $activeContextMenu}
    {#if $activeContextMenu.kind === "project"}
        {@const contextMenu = $activeContextMenu}
        {#if projectContextMenu}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="fixed z-[1000]"
                style="left: {$activeContextMenu.x}px; top: {$activeContextMenu.y}px;"
                onclick={(event) => event.stopPropagation()}
            >
                {@render projectContextMenu({
                    x: contextMenu.x,
                    y: contextMenu.y,
                    projectId: contextMenu.projectId,
                    project: contextMenu.project,
                    closeMenu: closeContextMenu,
                    runDefaultAction: async (action) => {
                        await runProjectDefaultAction(action, contextMenu.project, contextMenu.projectId);
                        closeContextMenu();
                    }
                })}
            </div>
        {:else}
            <MonacoContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                items={projectMenuItems(contextMenu.project)}
                onClose={closeContextMenu}
                onSelect={async (itemId) => {
                    await onProjectMenuAction(itemId, contextMenu.project, contextMenu.projectId);
                }}
            />
        {/if}
    {:else if $activeContextMenu.kind === "file"}
        {@const contextMenu = $activeContextMenu}
        {#if fileContextMenu}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="fixed z-[1000]"
                style="left: {$activeContextMenu.x}px; top: {$activeContextMenu.y}px;"
                onclick={(event) => event.stopPropagation()}
            >
                {@render fileContextMenu({
                    x: contextMenu.x,
                    y: contextMenu.y,
                    projectId: contextMenu.projectId,
                    file: contextMenu.file,
                    closeMenu: closeContextMenu,
                    runDefaultAction: async (action) => {
                        await runFileDefaultAction(action, contextMenu.file, contextMenu.projectId);
                        closeContextMenu();
                    }
                })}
            </div>
        {:else}
            <MonacoContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                items={fileMenuItems(contextMenu.file)}
                onClose={closeContextMenu}
                onSelect={async (itemId) => {
                    await onFileMenuAction(itemId, contextMenu.file, contextMenu.projectId);
                }}
            />
        {/if}
    {:else if $activeContextMenu.kind === "empty-tray"}
        {@const contextMenu = $activeContextMenu}
        {#if emptyTrayContextMenu}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="fixed z-[1000]"
                style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
                onclick={(event) => event.stopPropagation()}
            >
                {@render emptyTrayContextMenu({
                    x: contextMenu.x,
                    y: contextMenu.y,
                    closeMenu: closeContextMenu,
                    runDefaultAction: async (action) => {
                        await runEmptyTrayDefaultAction(action);
                        closeContextMenu();
                    }
                })}
            </div>
        {:else}
            <MonacoContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                items={emptyTrayMenuItems()}
                onClose={closeContextMenu}
                onSelect={onEmptyTrayMenuAction}
            />
        {/if}
    {:else if $activeContextMenu.kind === "folder"}
        {@const contextMenu = $activeContextMenu}
        {#if folderContextMenu}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="fixed z-[1000]"
                style="left: {$activeContextMenu.x}px; top: {$activeContextMenu.y}px;"
                onclick={(event) => event.stopPropagation()}
            >
                {@render folderContextMenu({
                    x: contextMenu.x,
                    y: contextMenu.y,
                    projectId: contextMenu.projectId,
                    folder: contextMenu.folder,
                    closeMenu: closeContextMenu,
                    runDefaultAction: async (action) => {
                        await runFolderDefaultAction(action, contextMenu.folder, contextMenu.projectId);
                        closeContextMenu();
                    }
                })}
            </div>
        {:else}
            <MonacoContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                items={folderMenuItems(contextMenu.folder)}
                onClose={closeContextMenu}
                onSelect={async (itemId) => {
                    await onFolderMenuAction(itemId, contextMenu.folder, contextMenu.projectId);
                }}
            />
        {/if}
    {/if}
{/if}
