<script lang="ts">
	import IconPreview from "$lib/tree/Icon.svelte";
	import type { File, Folder } from "../../lib/tree/types.ts";

	type EntryType = "file" | "folder";

	let entryType = $state<EntryType>("file");
	let entryName = $state("example.ts");
	let folderEntriesSpec = $state("file:index.ts\nfile:App.svelte\nfile:types.ts");

	const parsedFolderEntries = $derived.by(() => {
		const lines = folderEntriesSpec
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);

		const parsedEntries: (File | Folder)[] = [];
		const errors: string[] = [];

		for (const [index, line] of lines.entries()) {
			const separatorIndex = line.indexOf(":");
			if (separatorIndex <= 0 || separatorIndex === line.length - 1) {
				errors.push(`Line ${index + 1}: expected format <file|folder>:<name>`);
				continue;
			}

			const rawType = line.slice(0, separatorIndex).trim().toLowerCase();
			const rawName = line.slice(separatorIndex + 1).trim();

			if (rawType !== "file" && rawType !== "folder") {
				errors.push(`Line ${index + 1}: unknown type '${rawType}'`);
				continue;
			}

			if (!rawName) {
				errors.push(`Line ${index + 1}: name cannot be empty`);
				continue;
			}

			if (rawType === "file") {
				parsedEntries.push({ type: "file", name: rawName });
				continue;
			}

			parsedEntries.push({ type: "folder", name: rawName, subentries: [] });
		}

		return { entries: parsedEntries, errors };
	});

	const previewEntry = $derived.by<File | Folder>(() => {
		if (entryType === "file") {
			return { type: "file", name: entryName || "untitled" };
		}

		return {
			type: "folder",
			name: entryName || "folder",
			subentries: parsedFolderEntries.entries
		};
	});
</script>

<main class="icon-page">
	<h1>Icon Preview Playground</h1>

	<section class="step">
		<h2>Step 1: Select Entry Type</h2>
		<select bind:value={entryType}>
			<option value="file">file</option>
			<option value="folder">folder</option>
		</select>
	</section>

	<section class="step">
		<h2>Step 2: Enter Name</h2>
		<input
			type="text"
			bind:value={entryName}
			placeholder={entryType === "file" ? "example.ts" : "src"}
		/>
		<p class="hint">For files, extension drives icon lookup. Example: config.yaml</p>
	</section>

	{#if entryType === "folder"}
		<section class="step">
			<h2>Step 3: Configure Folder Entries</h2>
			<p class="hint">One entry per line, format: file:name.ext or folder:name</p>
			<textarea bind:value={folderEntriesSpec} rows="6"></textarea>

			{#if parsedFolderEntries.errors.length > 0}
				<ul class="errors">
					{#each parsedFolderEntries.errors as error}
						<li>{error}</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	<section class="preview">
		<h2>Result</h2>
		<div class="preview-row">
			{#key `${entryType}:${entryName}:${folderEntriesSpec}`}
				<IconPreview entry={previewEntry} size={28} />
			{/key}
			<span>{previewEntry.name}</span>
		</div>
	</section>
</main>

<style>
	.icon-page {
		max-width: 780px;
		margin: 2rem auto;
		padding: 0 1rem 2rem;
		display: grid;
		gap: 1rem;
	}

	.step,
	.preview {
		border: 1px solid #d7d7d7;
		border-radius: 0.75rem;
		padding: 1rem;
		background: #fff;
	}

	h1 {
		font-size: 1.6rem;
		margin: 0;
	}

	h2 {
		font-size: 1.05rem;
		margin: 0 0 0.6rem;
	}

	.hint {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #666;
	}

	input,
	select,
	textarea {
		width: 100%;
	}

	.preview-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		font-size: 1rem;
	}

	.errors {
		margin: 0.75rem 0 0;
		padding-left: 1rem;
		color: #b42318;
	}
</style>
