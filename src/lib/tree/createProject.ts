import { get } from "svelte/store";
import { creationInitialziedProject } from "./store.ts";

type StartCreateProjectHandler = () => Promise<void> | void;

const startCreateProjectHandlers = new Set<StartCreateProjectHandler>();

export function registerStartCreateProjectHandler(handler: StartCreateProjectHandler): () => void {
    startCreateProjectHandlers.add(handler);

    return () => {
        startCreateProjectHandlers.delete(handler);
    };
}

export function finishCreateProject(): void {
    creationInitialziedProject.set(false);
}

export function isProjectCreating(): boolean {
    return get(creationInitialziedProject);
}

export async function startCreateProject(): Promise<boolean> {
    if (isProjectCreating()) {
        return false;
    }

    creationInitialziedProject.set(true);

    if (!startCreateProjectHandlers.size) {
        finishCreateProject();
        return false;
    }

    try {
        await Promise.all([...startCreateProjectHandlers].map((handler) => Promise.resolve(handler())));
        return true;
    }
    catch (error) {
        finishCreateProject();
        throw error;
    }
}
