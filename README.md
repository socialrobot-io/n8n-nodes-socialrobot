# @socialrobot-io/n8n-nodes-socialrobot

This is an [n8n](https://n8n.io/) community node. It lets you use [SocialRobot.io](https://socialrobot.io) in your n8n workflows.

SocialRobot is a social media scheduler that lets you queue a week of posts in one sitting and publish across Instagram, X (Twitter), LinkedIn, TikTok, Facebook, Pinterest, Bluesky, Mastodon, and Threads. This node exposes the SocialRobot Scheduler API so you can build scheduling and publishing directly into your automations.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
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

After installation, **SocialRobot** appears in the node panel under the Input category.

## Operations

### Post

- **Create** — Create a single scheduled item that can target multiple connected social accounts at once. Supports draft, publish-now, and scheduled posting. Each target is one entry in a single **Targets** collection where you pick the **platform**, then the account; the platform determines which fields appear (for example Pinterest shows a **Board ID**, Bluesky hides the media fields). Media is attached inside each target, either as a public URL or as binary data from the input item (uploaded to SocialRobot automatically).
- **Get** — Fetch a single post by ID.
- **Get Many** — List posts with optional filters (status, platform, scheduled date range) and cursor pagination, including a **Return All** option.
- **Delete** — Delete a post by ID.
- **Reschedule** — Change the scheduled publish time of a post.

### Account

- **Get Many** — List all connected social accounts. Useful to discover account IDs (or just use the account picker, which loads them automatically).

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

### Create a post and publish it to X and LinkedIn

1. Add a **SocialRobot** node.
2. Set **Resource** to **Post** and **Operation** to **Create**.
3. Set **Schedule Type** to **Schedule** and choose a **Schedule Date**.
4. Click **Add Target**, set **Platform** to **X (Twitter)**, pick the account from the list, and type the post text.
5. Click **Add Target** again, set **Platform** to **LinkedIn**, pick the account, and type the text.
6. Optionally add media under each target's **Media** collection, either as a public URL or as binary data from the input item.

The node returns the created post ID (`{ "id": "..." }`).

### Post media from binary data

1. Add an **HTTP Request** node that downloads an image, with **Response Format** set to **File**. This saves the response as binary data under the `data` property.
2. Add a **SocialRobot** node with **Resource** = **Post** and **Operation** = **Create**.
3. Click **Add Target**, set **Platform** to **Instagram**, pick the account, then add a **Media** entry and set **Media Source** to **From Binary Data** with **Binary Property** set to `data`.
4. The node uploads the binary file to SocialRobot storage automatically and uses the resulting URL in the post.

To reference a public media URL instead, leave **Media Source** set to **By URL** and paste the URL into **Media URL**.

Media is attached through each target's **Media** collection. Most platforms accept multiple entries; Instagram accepts a single media entry. Each media entry has its own **Media Source**, **Media Type**, and URL or binary property. For Pinterest targets, set the **Pinterest Board ID** on the target.

### Filter scheduled posts

Set **Resource** = **Post** and **Operation** = **Get Many**, then add a **Filters** entry with **Status** = **Scheduled** to list everything waiting to publish.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [SocialRobot](https://socialrobot.io)
- [SocialRobot API documentation](https://socialrobot.io/scheduler/api-docs)

## Version history

### 1.0.5

Added binary media upload in Create Post (Media Source: By URL or From Binary Data) and removed the standalone Media resource.

### 1.0.0

Initial release with Post (Create, Get, Get Many, Delete, Reschedule) and Account (Get Many) operations.
