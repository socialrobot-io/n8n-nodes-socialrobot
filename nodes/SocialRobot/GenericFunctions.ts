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

// Human labels used in validation errors, keyed by platform value.
const PLATFORM_LABELS: Record<string, string> = {
	instagram: 'Instagram',
	x: 'X (Twitter)',
	linkedin: 'LinkedIn',
	bluesky: 'Bluesky',
	pinterest: 'Pinterest',
	tiktok: 'TikTok',
	mastodon: 'Mastodon',
	threads: 'Threads',
	facebook: 'Facebook',
};

async function buildInstagramTarget(
	this: IExecuteFunctions,
	itemIndex: number,
	t: IDataObject,
): Promise<IDataObject> {
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
	return target;
}

async function buildTwitterTarget(
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

async function buildLinkedinTarget(
	this: IExecuteFunctions,
	itemIndex: number,
	t: IDataObject,
): Promise<IDataObject> {
	const target: IDataObject = {
		accountId: extractId(t.accountId),
		caption: (t.caption as string) ?? '',
		medias: await buildMedias.call(this, itemIndex, t.medias),
	};
	if (t.postVisibility) {
		target.visibility = t.postVisibility;
	}
	if (t.firstComment) {
		target.firstComment = t.firstComment;
	}
	return target;
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
	if (t.title) {
		target.title = t.title;
	}
	if (t.description) {
		target.description = t.description;
	}
	if (t.link) {
		target.link = t.link;
	}
	return target;
}

async function buildTiktokTarget(
	this: IExecuteFunctions,
	itemIndex: number,
	t: IDataObject,
): Promise<IDataObject> {
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
	return target;
}

async function buildMastodonTarget(
	this: IExecuteFunctions,
	itemIndex: number,
	t: IDataObject,
): Promise<IDataObject> {
	const target: IDataObject = {
		accountId: extractId(t.accountId),
		caption: (t.caption as string) ?? '',
		medias: await buildMedias.call(this, itemIndex, t.medias),
	};
	if (t.visibility) {
		target.visibility = t.visibility;
	}
	return target;
}

async function buildThreadsTarget(
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
	if (t.isReel) {
		target.isReel = true;
	}
	if (t.isStory) {
		target.isStory = true;
	}
	return target;
}

/**
 * Build the request body for POST /posts from the node's create-post
 * parameters. The single `targets` collection is grouped by the selected
 * platform into the per-platform arrays the SocialRobot API expects.
 */
export async function buildCreateBody(this: IExecuteFunctions, itemIndex = 0): Promise<IDataObject> {
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

	for (const t of targets) {
		const platform = (t.platform as string) ?? '';
		switch (platform) {
			case 'instagram':
				instagramTargets.push(await buildInstagramTarget.call(this, itemIndex, t));
				break;
			case 'x':
				twitterTargets.push(await buildTwitterTarget.call(this, itemIndex, t));
				break;
			case 'linkedin':
				linkedinTargets.push(await buildLinkedinTarget.call(this, itemIndex, t));
				break;
			case 'bluesky':
				blueskyTargets.push(await buildBlueskyTarget.call(this, itemIndex, t));
				break;
			case 'pinterest':
				pinterestTargets.push(await buildPinterestTarget.call(this, itemIndex, t));
				break;
			case 'tiktok':
				tiktokTargets.push(await buildTiktokTarget.call(this, itemIndex, t));
				break;
			case 'mastodon':
				mastodonTargets.push(await buildMastodonTarget.call(this, itemIndex, t));
				break;
			case 'threads':
				threadsTargets.push(await buildThreadsTarget.call(this, itemIndex, t));
				break;
			case 'facebook':
				facebookTargets.push(await buildFacebookTarget.call(this, itemIndex, t));
				break;
			default:
				// A target without a platform value is caught by assertValidTargets.
				break;
		}
	}

	const body: IDataObject = {
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

	assertValidTargets(targets, body);

	return body;
}

/**
 * n8n can't reliably enforce `required` on fields nested inside a collection
 * type (they leak into global pre-execution validation), so we validate the
 * create body here and surface clear, per-target errors instead.
 */
function assertValidTargets(targets: IDataObject[], body: IDataObject): void {
	if (targets.length === 0) {
		throw new Error(
			'Add at least one target. Click "Add Target" and pick a platform, then select the account to publish to.',
		);
	}

	for (const target of targets) {
		const platform = (target.platform as string) ?? '';
		if (!platform) {
			throw new Error(
				'A target is missing a Platform. Pick Instagram, X, LinkedIn, or another platform for each target.',
			);
		}

		const label = PLATFORM_LABELS[platform] ?? platform;

		if (!extractId(target.accountId)) {
			throw new Error(
				`${label} target is missing an Account. Pick an account from the list, or switch to 'By ID' and enter an account ID.`,
			);
		}
		if (platform === 'instagram' && target.mediaSource !== 'binary' && !(target.mediaUrl as string)) {
			throw new Error(`${label} target is missing a Media URL.`);
		}
		if (platform === 'pinterest' && !(target.boardId as string)) {
			throw new Error(`${label} target is missing a Board ID.`);
		}
	}

	// Instagram requires media even when no target-level media was resolved
	// (for example a binary upload that produced no URL).
	for (const target of (body.instagramTargets as IDataObject[]) ?? []) {
		if (!target.mediaUrl) {
			throw new Error('Instagram target is missing a Media URL.');
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
