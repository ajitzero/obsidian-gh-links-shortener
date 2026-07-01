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
	if (type === 'repo') {
		// If there is a hash to the README, we don;t want to remove it
		return `[${owner}/${repo}](${pastedText})`;
	}
	if (type === 'release') {
		// GitHub only supports this within the original project,
		// so external links are not supported and owner/repo is not shown.
		return `[${id} (release)](${pastedText})`;
	}
	if (type === 'compare') {
		// GitHub only supports this within the original project,
		// so external links are not supported and owner/repo is not shown.
		return `[${id}](${pastedText})`;
	}

	const idPrefix = type === 'commit' ? '@' : '#';
	const idFormat = type === 'commit' ? id.slice(0, 7) : id;
	const suffix = url.hash && isCommentHash(url.hash) ? ' (comment)' : '';
	return `[${owner}/${repo}${idPrefix}${idFormat}${suffix}](${pastedText})`;
}

/**
 * Tries to parse properties if this is a valid URL.
 *
 * Test cases:
 * Case 1: Project Name
 * - https://github.com/owner/repo -> "owner/repo"
 *
 * Case 2: Issues, Pull Requests, Discussions
 * - https://github.com/owner/repo/issues/{issue-number} -> "owner/repo#{issue-number}"
 * - https://github.com/owner/repo/pull/{pr-id} -> "owner/repo#{pr-id}"
 * - https://github.com/owner/repo/discussions/{discussion-id} -> "owner/repo#{discussion-id}"
 *
 * Case 3: Commits
 * - https://github.com/owner/repo/commit/{commit-sha} -> "owner/repo@{commit-sha, first 7 characters only}"
 *
 * Case 4: Releases
 * - https://github.com/owner/repo/releases/tag/{tag-id} -> "{tag-id} (release)"
 *
 * Case 5: Compare changes between Tags or Commits
 * - https://github.com/owner/repo/compare/{old-tag/commit-id}...{new-tag/commit-id} -> "{old-tag/commit-id}...{new-tag/commit-id}"
 *
 * Exclusions:
 * - We don't need to show hash values, so we don't parse for them.
 *
 * Notes:
 * - Cases 2-5 have the same parsing logic, but need to be formatted in different ways. Maybe we should move this comment to the formatGHLink function instead of here.
 */
function parseDetails(pathname: URL['pathname']) {
	// Check Case 1
	let regex = /^\/([^/]+)\/([^/]+)\/?$/;
	let match = regex.exec(pathname);
	if (match) {
		const [, owner, repo] = match;
		return { owner, repo, type: 'repo', id: '' };
	}

	// Check Case 2-5
	regex = /^\/([^/]+)\/([^/]+)\/(issues|pull|discussions|commit|releases\/tag|compare)\/([^/]+)\/?$/;
	match = regex.exec(pathname);
	if (match) {
		const [, owner, repo, type, id] = match;
		return { owner, repo, type: type === 'releases/tag' ? 'release' : type, id };
	}

	// Not a valid URL we care about. Ignore.
	return null;
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
