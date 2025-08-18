import { Editor, MarkdownView, Plugin } from 'obsidian';

export default class GHLinksShortenerPlugin extends Plugin {
	async onload() {
		this.registerEvent(
			this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor, view: MarkdownView) => {
				const pastedText = evt.clipboardData?.getData("text/plain");
				if (!pastedText) return;

				const modifiedText = formatGHLink(pastedText);
				if (!modifiedText) return;

				evt.preventDefault();
				editor.replaceSelection(modifiedText);
			})
		);
	}
}

function formatGHLink(pastedText: string): string | null {
	if (!pastedText || /\s/.test(pastedText)) return null;

	let url;
	try {
		url = new URL(pastedText);
	} catch (error) {
		if (error instanceof TypeError) {
			// Wasn't a valid URL. Ignore.
			return null;
		}
		throw error;
	}

	// TODO: Support other hostnames for Enterprise, etc?
	if (url.hostname != 'github.com') {
		return null;
	}
	if (url.hash) {
		// Don't replace with simple reference if there's a hash like "#issuecomment-492445254".
		// TODO: Replace those but with a "(comment)" suffix?
		return null;
	}

	const pullOrIssueRegex = /^\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)\/?$/;
	const match = pullOrIssueRegex.exec(url.pathname);
	if (match) {
		const [, owner, repo, , number] = match;
		return `[${owner}/${repo}#${number}](${pastedText})`;
	}

	// Didn't match any path pattern. Ignore.
	return null;
}
