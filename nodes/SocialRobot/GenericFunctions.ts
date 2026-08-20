import type { IBinaryData, IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { uploadMedia } from './transport';

/**
 * Normalise a collection value (which n8n may return as an array, a single
 * object, an empty object, or undefined depending on how many entries the
 * user added) into an array of items.
 */
function toItems(value: unknown): IDataObject[] {
	if (value == null) {
		return [];
	}
	if (Array.isArray(value)) {
		return value as IDataObject[];
	}
	if (typeof value === 'object') {
		if (Object.keys(value as object).length === 0) {
			return [];
		}
		return [value as IDataObject];
	}
	return [];
}

/**
 * Extract the underlying id from a resource locator value, which may be a
 * plain string or an object shaped like { mode: 'list' | 'id', value: '...' }.
 */
export function extractId(value: unknown): string {
	if (typeof value === 'string') {
		return value;
	}
	if (value && typeof value === 'object' && 'value' in value) {
		return String((value as IDataObject).value ?? '');
	}
	return '';
}

const MIME_TO_EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'video/mp4': 'mp4',
	'video/quicktime': 'mov',
	'video/webm': 'webm',
};

function inferFileName(binaryData: IBinaryData): string {
	if (binaryData.fileName) {
		return binaryData.fileName;
	}
	const mimeType = (binaryData.mimeType || '').toLowerCase();
	return `media.${MIME_TO_EXT[mimeType] || 'bin'}`;
}

/**
 * Resolve a media entry to a public URL. When the media source is binary, the
 * file is uploaded to SocialRobot storage first and the resulting URL returned.
 * Otherwise the provided public URL is returned unchanged.
 */
async function resolveMediaUrl(
	this: IExecuteFunctions,
	itemIndex: number,
	media: IDataObject,
): Promise<string> {
	if (media.mediaSource === 'binary') {
		const propertyName = (media.binaryPropertyName as string) || 'data';
		const binaryData = this.helpers.assertBinaryData(itemIndex, propertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, propertyName);
		const fileName = inferFileName(binaryData);
		const mimeType = binaryData.mimeType || 'application/octet-stream';
		return uploadMedia.call(this, fileName, mimeType, buffer);
	}
	return (media.mediaUrl as string) || '';
}

/**
 * Map a `medias` collection value into the array shape the SocialRobot API
 * expects: [{ mediaType, mediaUrl, altText? }], uploading binary media first.
 */
async function buildMedias(
	this: IExecuteFunctions,
	itemIndex: number,
	value: unknown,
): Promise<IDataObject[]> {
	const items = toItems(value);
	const result: IDataObject[] = [];
	for (const media of items) {
		const item: IDataObject = {
			mediaType: media.mediaType ?? 'IMAGE',
			mediaUrl: await resolveMediaUrl.call(this, itemIndex, media),
		};
		if (media.altText) {
			item.altText = media.altText;
		}
		result.push(item);
	}
	return result;
}

/**
 * Build an Instagram target. Instagram uses a single media item (mediaType +
 * mediaUrl) rather than a `medias` array, so it is read from the first entry
 * of the shared Media collection.
 */
async function buildInstagramTarget(
	this: IExecuteFunctions,
	itemIndex: number,
	t: IDataObject,
): Promise<IDataObject> {
	const medias = await buildMedias.call(this, itemIndex, t.medias);
	if (medias.length === 0) {
		throw new Error('Instagram target is missing media. Add one media entry under Media.');
	}
	if (medias.length > 1) {
		throw new Error('Instagram supports a single media file. Add only one media entry.');
	}
	const first = medias[0];
	return {
		accountId: extractId(t.accountId),
		caption: (t.caption as string) ?? '',
		mediaType: first.mediaType ?? 'IMAGE',
		mediaUrl: first.mediaUrl,
	};
}

/**
 * Build a target for the platforms that share the `{ accountId, caption,
 * medias[] }` shape: X, LinkedIn, TikTok, Mastodon, and Threads.
 */
async function buildCaptionMediaTarget(
	this: IExecuteFunctions,
	itemIndex: number,
	t: IDataObject,
): Promise<IDataObject> {
	return {
		accountId: extractId(t.accountId),
		caption: (t.caption as string) ?? '',
		medias: await buildMedias.call(this, itemIndex, t.medias),
	};
}

async function buildBlueskyTarget(
	this: IExecuteFunctions,
	itemIndex: number,
	t: IDataObject,
): Promise<IDataObject> {
	return {
		accountId: extractId(t.accountId),
		caption: (t.caption as string) ?? '',
	};
}

async function buildPinterestTarget(
	this: IExecuteFunctions,
	itemIndex: number,
	t: IDataObject,
): Promise<IDataObject> {
	const target: IDataObject = {
		accountId: extractId(t.accountId),
		boardId: (t.boardId as string) ?? '',
		mediaType: 'IMAGE',
		medias: await buildMedias.call(this, itemIndex, t.medias),
	};
	if (t.caption) {
		target.description = t.caption;
	}
	return target;
}

async function buildFacebookTarget(
	this: IExecuteFunctions,
	itemIndex: number,
	t: IDataObject,
): Promise<IDataObject> {
	const target: IDataObject = {
		accountId: extractId(t.accountId),
		medias: await buildMedias.call(this, itemIndex, t.medias),
	};
	if (t.caption) {
		target.caption = t.caption;
	}
	return target;
}

/**
 * Build the request body for POST /posts from the node's create-post
 * parameters. Each target is a connected account; its platform is looked up
 * from `accountPlatforms` (built once per execution) and used to group the
 * target into the per-platform arrays the SocialRobot API expects.
 */
export async function buildCreateBody(
	this: IExecuteFunctions,
	itemIndex: number,
	accountPlatforms: Map<string, string>,
): Promise<IDataObject> {
	const publishMode = this.getNodeParameter('publishMode', itemIndex) as string;

	const scheduledFor: IDataObject = { publish: publishMode };
	if (publishMode === 'SCHEDULE') {
		scheduledFor.date = this.getNodeParameter('scheduleDate', itemIndex) as string;
	}

	const instagramTargets: IDataObject[] = [];
	const twitterTargets: IDataObject[] = [];
	const linkedinTargets: IDataObject[] = [];
	const blueskyTargets: IDataObject[] = [];
	const pinterestTargets: IDataObject[] = [];
	const tiktokTargets: IDataObject[] = [];
	const mastodonTargets: IDataObject[] = [];
	const threadsTargets: IDataObject[] = [];
	const facebookTargets: IDataObject[] = [];

	const targets = toItems(this.getNodeParameter('targets', itemIndex, []));

	if (targets.length === 0) {
		throw new Error('Add at least one target. Click "Add Account" and select a connected account.');
	}

	for (const t of targets) {
		const accountId = extractId(t.accountId);
		if (!accountId) {
			throw new Error(
				'A target is missing an Account. Pick an account from the list, or switch to "By ID" and enter an account ID.',
			);
		}

		const platform = accountPlatforms.get(accountId);
		if (!platform) {
			throw new Error(
				`Account "${accountId}" was not found among your connected accounts. Check the account ID or reconnect it in SocialRobot.`,
			);
		}

		switch (platform) {
			case 'instagram':
				instagramTargets.push(await buildInstagramTarget.call(this, itemIndex, t));
				break;
			case 'x':
				twitterTargets.push(await buildCaptionMediaTarget.call(this, itemIndex, t));
				break;
			case 'linkedin':
				linkedinTargets.push(await buildCaptionMediaTarget.call(this, itemIndex, t));
				break;
			case 'bluesky':
				blueskyTargets.push(await buildBlueskyTarget.call(this, itemIndex, t));
				break;
			case 'pinterest':
				if (!(t.boardId as string)) {
					throw new Error(
						'Pinterest target is missing a Board ID. Enter the board to pin to under "Pinterest Board ID".',
					);
				}
				pinterestTargets.push(await buildPinterestTarget.call(this, itemIndex, t));
				break;
			case 'tiktok':
				tiktokTargets.push(await buildCaptionMediaTarget.call(this, itemIndex, t));
				break;
			case 'mastodon':
				mastodonTargets.push(await buildCaptionMediaTarget.call(this, itemIndex, t));
				break;
			case 'threads':
				threadsTargets.push(await buildCaptionMediaTarget.call(this, itemIndex, t));
				break;
			case 'facebook':
				facebookTargets.push(await buildFacebookTarget.call(this, itemIndex, t));
				break;
			default:
				throw new Error(`Unsupported platform "${platform}" for account "${accountId}".`);
		}
	}

	return {
		scheduledFor,
		instagramTargets,
		twitterTargets,
		linkedinTargets,
		blueskyTargets,
		pinterestTargets,
		tiktokTargets,
		mastodonTargets,
		threadsTargets,
		facebookTargets,
	};
}

/**
 * Build the query string for GET /posts from the node's Get Many filters.
 */
export function buildListQuery(this: IExecuteFunctions, itemIndex: number): IDataObject {
	const qs: IDataObject = {};

	const filters = (this.getNodeParameter('filters', itemIndex, {}) as IDataObject) || {};

	if (filters.status) {
		qs.status = filters.status;
	}
	if (filters.platform) {
		qs.platform = filters.platform;
	}
	if (filters.dateFrom) {
		qs.dateFrom = filters.dateFrom;
	}
	if (filters.dateTo) {
		qs.dateTo = filters.dateTo;
	}

	return qs;
}
