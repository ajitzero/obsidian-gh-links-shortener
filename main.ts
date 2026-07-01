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

	const details = parseDetails(url.pathname);
	if (!details) {
		return null;
	}

	const { owner, repo, type, id } = details;
	const idPrefix = type === 'commit' ? '@' : '#';
	const idFormat = type === 'commit' ? id.slice(0, 7) : id;
	const suffix = url.hash && isCommentHash(url.hash) ? ' (comment)' : '';
	return `[${owner}/${repo}${idPrefix}${idFormat}${suffix}](${pastedText})`;
}

/**
 * Tries to parse properties if this is a valid URL.
 *
 * Test cases:
 * Case 1:
 * - https://github.com/owner/repo/issues/{issue-number} -> owner/repo#{issue-number}
 * - https://github.com/owner/repo/pull/{pr-id} -> owner/repo#{pr-id}
 * - https://github.com/owner/repo/discussions/{discussion-id} -> owner/repo#{discussion-id}
 *
 * Case 2:
 * - https://github.com/owner/repo/commit/{commit-sha} -> owner/repo@{commit-sha, first 7 characters only}
 */
function parseDetails(pathname: URL['pathname']) {
	const regex = /^\/([^/]+)\/([^/]+)\/(issues|pull|discussions|commit)\/([^/]+)\/?$/;
	const match = regex.exec(pathname);
	if (!match) {
		return null;
	}
	const [, owner, repo, type, id] = match;
	return { owner, repo, type, id };
}

/**
 * Checks if the hash is a comment hash.
 *
 * Test cases:
 * - #issue-{number}
 * - #issuecomment-{number}
 * - #pullrequestreview-{number}
 * - #review-{number}
 * - #discussion-{number}
 * - #discussion_r{number} (no hyphen)
 * - #discussioncomment-{number}
 *
 * Other factors:
 * - Optional hyphen in some cases.
 * - Optional trailing slash in some cases.
 */
function isCommentHash(hash: URL['hash']): boolean {
	return /^#(?:issue(?:comment)?|discussion(?:comment|_r)?|(?:pullrequest)?review)-?\d+\/?$/.test(hash || '');
}
