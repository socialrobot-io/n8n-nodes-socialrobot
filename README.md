# @socialrobot-io/n8n-nodes-socialrobot

This is an [n8n](https://n8n.io/) community node. It lets you use [SocialRobot.io](https://socialrobot.io) in your n8n workflows.

SocialRobot is a social media scheduler that lets you queue a week of posts in one sitting and publish across Instagram, X (Twitter), LinkedIn, TikTok, Facebook, Pinterest, Bluesky, Mastodon, and Threads. This package exposes the SocialRobot Scheduler API so you can build scheduling and publishing directly into your automations.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Nodes](#nodes)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In short:

1. In n8n, go to **Settings → Community Nodes**.
2. Select **Install**.
3. Enter `@socialrobot-io/n8n-nodes-socialrobot` in the **npm package name** field.
4. Select **Install**.

## Nodes

The package ships one node, **SocialRobot**. Pick a **Resource** to choose what it does:

- A platform resource (**Instagram**, **X (Twitter)**, **LinkedIn**, **TikTok**, **Facebook**, **Pinterest**, **Bluesky**, **Mastodon**, **Threads**) publishes a post to that platform.
- **Post** and **Account** manage posts and connected accounts.

Because each platform is its own Resource, the node only shows the fields that platform actually supports, and the account picker only lists accounts on that platform.

### Publish (one Resource per platform)

Each platform resource has a single **Create** operation that publishes one post for a connected account on that platform. Every platform shares the same shape: an **Account** picker, a **Caption**, platform-specific media fields, and **Schedule Type** (Draft, Publish Now, or Schedule) with an optional **Schedule Date**.

| Resource | Media model |
| --- | --- |
| Instagram | Single image or video (required) |
| X (Twitter) | Multiple media, up to 4; GIF supported |
| LinkedIn | Image or video post (required) |
| TikTok | Photo or video post (required) |
| Facebook | Optional media |
| Pinterest | Image or video pin (required), plus a **Board ID** |
| Bluesky | Text only |
| Mastodon | Optional images/videos |
| Threads | Optional media |

Media is attached either as a public URL or as binary data from the input item (uploaded to SocialRobot storage automatically).

### Post and Account (management)

- **Post → Get** — Fetch a single post by ID.
- **Post → Get Many** — List posts with optional filters (status, platform, scheduled date range) and cursor pagination, including a **Return All** option.
- **Post → Delete** — Delete a post by ID.
- **Post → Reschedule** — Change the scheduled publish time of a post.
- **Account → Get Many** — List all connected social accounts. Useful to discover account IDs (or just use the account picker, which loads them automatically).

## Credentials

The node authenticates with a SocialRobot API key.

### Prerequisites

1. Sign up for [SocialRobot](https://socialrobot.io).
2. Open the app and go to **Scheduler → API Keys**.
3. Create an API key and copy it.

### Setting up the credential

1. In n8n, go to **Credentials → Add Credential** and search for **SocialRobot API**.
2. Enter the **API Key** you created in SocialRobot.
3. Leave **Base URL** at the default (`https://socialrobot.io/api`) for the hosted service. If you are running SocialRobot locally or on a self-hosted instance, point it at your own API base URL (for example `http://localhost:3000/api`).

Use the **Test** button to verify the credential. It calls `GET /accounts` and should succeed if the key is valid.

> **Note:** publishing a post requires at least one connected social account in SocialRobot. Connect accounts under **Accounts** in the app before creating posts.

## Compatibility

- Requires n8n version **1.0.0** or later.
- Developed and tested against `n8n-workflow` version 1.x.

## Usage

### Publish a scheduled post to X

1. Add a **SocialRobot** node.
2. Set **Resource** to **X (Twitter)**.
3. Pick your X account from the **Account** dropdown.
4. Type the post text in **Caption**.
5. Set **Schedule Type** to **Schedule** and choose a **Schedule Date**.

The node returns the created post ID (`{ "id": "..." }`).

### Post media from binary data

1. Add an **HTTP Request** node that downloads an image, with **Response Format** set to **File**. This saves the response as binary data under the `data` property.
2. Add a **SocialRobot** node, set **Resource** to **Instagram**, and pick your Instagram account.
3. Set **Media Source** to **From Binary Data** and leave **Binary Property** as `data`.

The node uploads the binary file to SocialRobot storage automatically and uses the resulting URL in the post. To reference a public media URL instead, leave **Media Source** set to **By URL** and paste the URL into **Media URL**.

For platforms with a **Media** collection (X, Threads, Facebook, TikTok, LinkedIn, Pinterest, Mastodon), click **Add Media** to attach one or more entries; each entry has its own **Media Source**, **Media Type**, and URL or binary property. For the **Pinterest** resource, also set the **Pinterest Board ID**.

### Filter scheduled posts

Add a **SocialRobot** node, set **Resource** to **Post** and **Operation** to **Get Many**, then add a **Filters** entry with **Status** = **Scheduled** to list everything waiting to publish.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [SocialRobot](https://socialrobot.io)
- [SocialRobot API documentation](https://socialrobot.io/scheduler/api-docs)
- [Workflow templates](https://github.com/socialrobot-io/n8n-socialrobot-templates) — 36 ready-to-import workflows

## Version history

### 3.0.0

Consolidated the package into a single **SocialRobot** node (n8n allows one regular node per package). Each platform is now a Resource with its own Create operation, platform-scoped fields, and platform-scoped account picker. The per-platform request shapes from 2.0.0 are unchanged.

### 2.0.0

Split the single node into nine per-platform **Publish to ...** nodes plus a management-only **SocialRobot** node. Superseded by 3.0.0 after n8n review (one node per service).

### 1.0.5

Added binary media upload in Create Post (Media Source: By URL or From Binary Data) and removed the standalone Media resource.

### 1.0.0

Initial release with Post (Create, Get, Get Many, Delete, Reschedule) and Account (Get Many) operations.
