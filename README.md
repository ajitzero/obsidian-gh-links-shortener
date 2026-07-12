# My changes with this fork

<details>
<summary>Set 1 (Merged)</summary>

Source:
- Branch: [`feat/issue-comments`](https://github.com/ajitzero/obsidian-gh-links-shortener/tree/feat/issue-comments)
- Pull Request: https://github.com/dbarnett/obsidian-gh-links-shortener/pull/1 (Merged)

Added support for more link types:
- Added support for Comments. `#issuecomment-<id>` as the hash, including review comments and discussion comments.
- Added support for Discussions. Same pattern as Issues & Pull Requests.
- Added support for Commit SHA: `owner/repo@{commit-sha, first 7 characters only}`
- Added support for Releases: `v1.0.0 (release)`
- Added support for Range comparison: `v1.0.0...v2.0.0`
- Added support for the base project name itself: `owner/repo`
</details>

<details>
<summary>Set 2 (Planning)</summary>

## Ideas for "Extended" features
- My changes are limited to URLs supported by GitHub. Ideally, for Obsidian users, we want to show `owner/repo` info even for Releases and Range Comparison, but that deviates from GitHub's behaviour and should probably be a separate "GH Link Extended" plugin, or be configurable in a settings page. Might do that some day.
- Displaying the full Commit SHA might be useful for some people. I personally didn't need this, so I didn't implement it.
- Displaying a repo name, potentially with the branch being specified, would be useful. I'll add this soon.
- Displaying a file path, especially with the branch being specified, could be useful. The issue is that for deeply nested paths, any shortened names are detrimental. Just showing the file name could be good though, optionally with branch name. I might add this soon.

</details>

---

# GH Links Shortener Plugin

This is a very simple Obsidian plugin which captures pasted text and sets the link title to a shortened GitHub ref text if it detects it's a link to a GitHub repo, issue, pull request, etc.

Example:

- `https://github.com/EnterpriseQualityCoding/FizzBuzzEnterpriseEdition/pull/1` → `[EnterpriseQualityCoding/FizzBuzzEnterpriseEdition#1](https://github.com/EnterpriseQualityCoding/FizzBuzzEnterpriseEdition/pull/1)`

# Related plugins

- [GitHub Link](https://github.com/nathonius/obsidian-github-link) offers a different mechanism to enrich GitHub links, dynamically fetching info when you view a page and rendering a nice badge
- [JIRA links shortener](https://github.com/rplatonovs/obsidian-jira-links-shortener) does the same thing but for JIRA issue URLs

# Acknowledgements

Heavily inspired by https://github.com/rplatonovs/obsidian-jira-links-shortener.
