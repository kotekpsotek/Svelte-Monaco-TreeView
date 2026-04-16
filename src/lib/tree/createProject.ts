import { get } from "svelte/store";
import { creationInitialziedProject } from "./store.ts";

type StartCreateProjectHandler = () => Promise<void> | void;

let startCreateProjectHandler: StartCreateProjectHandler | null = null;

export function registerStartCreateProjectHandler(handler: StartCreateProjectHandler): () => void {
    startCreateProjectHandler = handler;

    return () => {
        if (startCreateProjectHandler === handler) {
            startCreateProjectHandler = null;
        }
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

    if (!startCreateProjectHandler) {
        finishCreateProject();
        return false;
    }

    try {
        await startCreateProjectHandler();
        return true;
    }
    catch (error) {
        finishCreateProject();
        throw error;
    }
}
