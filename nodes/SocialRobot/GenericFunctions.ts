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
 * Build the request body for POST /posts from the node's create-post
 * parameters.
 */
export async function buildCreateBody(this: IExecuteFunctions, itemIndex = 0): Promise<IDataObject> {
	const publishMode = this.getNodeParameter('publishMode', itemIndex) as string;

	const scheduledFor: IDataObject = { publish: publishMode };
	if (publishMode === 'SCHEDULE') {
		scheduledFor.date = this.getNodeParameter('scheduleDate', itemIndex) as string;
	}

	const body: IDataObject = { scheduledFor };

	const instagramTargets: IDataObject[] = [];
	for (const t of toItems(this.getNodeParameter('instagramTargets', itemIndex, []))) {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			caption: (t.caption as string) ?? '',
			mediaType: (t.mediaType as string) ?? 'IMAGE',
			mediaUrl: await resolveMediaUrl.call(this, itemIndex, t),
		};
		if (t.isStory) {
			target.isStory = true;
		}
		if ((t.mediaType as string) === 'VIDEO' && t.coverUrl) {
			target.coverUrl = t.coverUrl;
		}
		instagramTargets.push(target);
	}
	body.instagramTargets = instagramTargets;

	const twitterTargets: IDataObject[] = [];
	for (const t of toItems(this.getNodeParameter('twitterTargets', itemIndex, []))) {
		twitterTargets.push({
			accountId: extractId(t.accountId),
			caption: (t.caption as string) ?? '',
			medias: await buildMedias.call(this, itemIndex, t.medias),
		});
	}
	body.twitterTargets = twitterTargets;

	const linkedinTargets: IDataObject[] = [];
	for (const t of toItems(this.getNodeParameter('linkedinTargets', itemIndex, []))) {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			caption: (t.caption as string) ?? '',
			medias: await buildMedias.call(this, itemIndex, t.medias),
		};
		if (t.visibility) {
			target.visibility = t.visibility;
		}
		if (t.firstComment) {
			target.firstComment = t.firstComment;
		}
		linkedinTargets.push(target);
	}
	body.linkedinTargets = linkedinTargets;

	body.blueskyTargets = toItems(this.getNodeParameter('blueskyTargets', itemIndex, [])).map((t) => ({
		accountId: extractId(t.accountId),
		caption: (t.caption as string) ?? '',
	}));

	const pinterestTargets: IDataObject[] = [];
	for (const t of toItems(this.getNodeParameter('pinterestTargets', itemIndex, []))) {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			boardId: (t.boardId as string) ?? '',
			mediaType: 'IMAGE',
			medias: await buildMedias.call(this, itemIndex, t.medias),
		};
		if (t.title) {
			target.title = t.title;
		}
		if (t.description) {
			target.description = t.description;
		}
		if (t.link) {
			target.link = t.link;
		}
		pinterestTargets.push(target);
	}
	body.pinterestTargets = pinterestTargets;

	const tiktokTargets: IDataObject[] = [];
	for (const t of toItems(this.getNodeParameter('tiktokTargets', itemIndex, []))) {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			caption: (t.caption as string) ?? '',
			medias: await buildMedias.call(this, itemIndex, t.medias),
		};
		if (t.privacyLevel) {
			target.privacyLevel = t.privacyLevel;
		}
		if (t.postMode) {
			target.postMode = t.postMode;
		}
		tiktokTargets.push(target);
	}
	body.tiktokTargets = tiktokTargets;

	const mastodonTargets: IDataObject[] = [];
	for (const t of toItems(this.getNodeParameter('mastodonTargets', itemIndex, []))) {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			caption: (t.caption as string) ?? '',
			medias: await buildMedias.call(this, itemIndex, t.medias),
		};
		if (t.visibility) {
			target.visibility = t.visibility;
		}
		mastodonTargets.push(target);
	}
	body.mastodonTargets = mastodonTargets;

	const threadsTargets: IDataObject[] = [];
	for (const t of toItems(this.getNodeParameter('threadsTargets', itemIndex, []))) {
		threadsTargets.push({
			accountId: extractId(t.accountId),
			caption: (t.caption as string) ?? '',
			medias: await buildMedias.call(this, itemIndex, t.medias),
		});
	}
	body.threadsTargets = threadsTargets;

	const facebookTargets: IDataObject[] = [];
	for (const t of toItems(this.getNodeParameter('facebookTargets', itemIndex, []))) {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			medias: await buildMedias.call(this, itemIndex, t.medias),
		};
		if (t.caption) {
			target.caption = t.caption;
		}
		if (t.isReel) {
			target.isReel = true;
		}
		if (t.isStory) {
			target.isStory = true;
		}
		facebookTargets.push(target);
	}
	body.facebookTargets = facebookTargets;

	assertValidTargets(body);

	return body;
}

/**
 * n8n can't reliably enforce `required` on fields nested inside a collection
 * type (they leak into global pre-execution validation), so we validate the
 * create body here and surface clear, per-target errors instead.
 */
function assertValidTargets(body: IDataObject): void {
	const platforms: Array<[string, string]> = [
		['instagramTargets', 'Instagram'],
		['pinterestTargets', 'Pinterest'],
		['twitterTargets', 'X (Twitter)'],
		['linkedinTargets', 'LinkedIn'],
		['blueskyTargets', 'Bluesky'],
		['tiktokTargets', 'TikTok'],
		['mastodonTargets', 'Mastodon'],
		['threadsTargets', 'Threads'],
		['facebookTargets', 'Facebook'],
	];

	for (const [key, label] of platforms) {
		const targets = (body[key] as IDataObject[]) ?? [];
		for (const target of targets) {
			if (!target.accountId) {
				throw new Error(
					`${label} target is missing an Account. Pick an account from the list, or switch to 'By ID' and enter an account ID.`,
				);
			}
			if (key === 'instagramTargets' && !target.mediaUrl) {
				throw new Error(`${label} target is missing a Media URL.`);
			}
			if (key === 'pinterestTargets' && !target.boardId) {
				throw new Error(`${label} target is missing a Board ID.`);
			}
		}
	}
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
