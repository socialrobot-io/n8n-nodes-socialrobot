import type { IBinaryData, IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { uploadMedia } from './transport';

/**
 * The platforms SocialRobot can publish to. The n8n package exposes one publish
 * node per platform; this union keeps the shared body builder type-safe.
 */
export type Platform =
	| 'instagram'
	| 'x'
	| 'linkedin'
	| 'bluesky'
	| 'pinterest'
	| 'tiktok'
	| 'mastodon'
	| 'threads'
	| 'facebook';

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

/** Best-effort filename from a public URL (used for Mastodon's `name` field). */
function deriveNameFromUrl(url: string): string {
	const clean = url.split('?')[0].split('#')[0];
	const segment = clean.split('/').filter(Boolean).pop();
	return segment || 'media';
}

interface ResolvedMedia {
	url: string;
	name: string;
	size: number;
}

/**
 * Resolve a media reference to a public URL, filename and size. When the media
 * source is binary, the file is uploaded to SocialRobot storage first and the
 * resulting URL returned (alongside the original name and byte size). Otherwise
 * the provided public URL is returned with a derived name and size 0.
 */
async function resolveMediaRef(
	this: IExecuteFunctions,
	itemIndex: number,
	media: IDataObject,
): Promise<ResolvedMedia> {
	if (media.mediaSource === 'binary') {
		const propertyName = (media.binaryPropertyName as string) || 'data';
		const binaryData = this.helpers.assertBinaryData(itemIndex, propertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, propertyName);
		const name = inferFileName(binaryData);
		const mimeType = binaryData.mimeType || 'application/octet-stream';
		const url = await uploadMedia.call(this, name, mimeType, buffer);
		return { url, name, size: buffer.length };
	}
	const url = (media.mediaUrl as string) || '';
	return { url, name: deriveNameFromUrl(url), size: 0 };
}

function readMediaItems(this: IExecuteFunctions, itemIndex: number): IDataObject[] {
	return toItems(this.getNodeParameter('medias', itemIndex, []));
}

/**
 * Flat media array `[{ mediaType, mediaUrl, altText? }]` used by X, Threads,
 * and Facebook.
 */
async function buildFlatMedias(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject[]> {
	const items = readMediaItems.call(this, itemIndex);
	const result: IDataObject[] = [];
	for (const media of items) {
		const { url } = await resolveMediaRef.call(this, itemIndex, media);
		const item: IDataObject = { mediaType: media.mediaType ?? 'IMAGE', mediaUrl: url };
		if (media.altText) {
			item.altText = media.altText;
		}
		result.push(item);
	}
	return result;
}

/**
 * Nested media object `{ mediaType, medias: [{ mediaUrl, altText? }] }` used by
 * TikTok, LinkedIn, and Pinterest. These platforms require at least one media.
 */
async function buildNestedMedias(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const items = readMediaItems.call(this, itemIndex);
	if (items.length === 0) {
		throw new Error('This platform requires media. Add at least one media entry.');
	}
	const mediaType = (items[0].mediaType as string) || 'IMAGE';
	const medias: IDataObject[] = [];
	for (const media of items) {
		const { url } = await resolveMediaRef.call(this, itemIndex, media);
		const item: IDataObject = { mediaUrl: url };
		if (media.altText) {
			item.altText = media.altText;
		}
		medias.push(item);
	}
	return { mediaType, medias };
}

/**
 * Mastodon media array `[{ name, mediaUrl, size, mediaType, alt? }]`. Mastodon
 * requires a filename and byte size per media, which we can only know exactly
 * for binary input (URL media uses a derived name and size 0).
 */
async function buildMastodonMedias(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject[]> {
	const items = readMediaItems.call(this, itemIndex);
	const result: IDataObject[] = [];
	for (const media of items) {
		const { url, name, size } = await resolveMediaRef.call(this, itemIndex, media);
		const item: IDataObject = { name, mediaUrl: url, size, mediaType: media.mediaType ?? 'IMAGE' };
		if (media.altText) {
			item.alt = media.altText;
		}
		result.push(item);
	}
	return result;
}

/**
 * Read the shared account + caption parameters that every publish node has.
 */
function baseTarget(this: IExecuteFunctions, itemIndex: number): { accountId: string; caption: string } {
	const accountId = extractId(this.getNodeParameter('accountId', itemIndex));
	if (!accountId) {
		throw new Error(
			'Select an account to publish to. Pick from the list, or switch to "By ID" and enter an account ID.',
		);
	}
	const caption = (this.getNodeParameter('caption', itemIndex, '') as string) ?? '';
	return { accountId, caption };
}

async function buildInstagramTarget(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const { accountId, caption } = baseTarget.call(this, itemIndex);
	const mediaSource = this.getNodeParameter('mediaSource', itemIndex, 'url') as string;
	const { url } = await resolveMediaRef.call(this, itemIndex, {
		mediaSource,
		mediaUrl: this.getNodeParameter('mediaUrl', itemIndex, '') as string,
		binaryPropertyName: this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string,
	});
	if (!url) {
		throw new Error('Instagram requires media. Provide a media URL or binary data.');
	}
	const mediaType = this.getNodeParameter('mediaType', itemIndex, 'IMAGE') as string;
	return { accountId, caption, mediaType, mediaUrl: url };
}

async function buildTwitterTarget(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const { accountId, caption } = baseTarget.call(this, itemIndex);
	return { accountId, caption, medias: await buildFlatMedias.call(this, itemIndex) };
}

async function buildThreadsTarget(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const { accountId, caption } = baseTarget.call(this, itemIndex);
	return { accountId, caption, medias: await buildFlatMedias.call(this, itemIndex) };
}

async function buildFacebookTarget(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const { accountId, caption } = baseTarget.call(this, itemIndex);
	const target: IDataObject = { accountId, medias: await buildFlatMedias.call(this, itemIndex) };
	if (caption) {
		target.caption = caption;
	}
	return target;
}

async function buildBlueskyTarget(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	return baseTarget.call(this, itemIndex);
}

async function buildMastodonTarget(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const { accountId, caption } = baseTarget.call(this, itemIndex);
	return { accountId, caption, medias: await buildMastodonMedias.call(this, itemIndex) };
}

async function buildTiktokTarget(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const { accountId, caption } = baseTarget.call(this, itemIndex);
	return { accountId, caption, medias: await buildNestedMedias.call(this, itemIndex) };
}

async function buildLinkedinTarget(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const { accountId, caption } = baseTarget.call(this, itemIndex);
	return { accountId, caption, medias: await buildNestedMedias.call(this, itemIndex) };
}

async function buildPinterestTarget(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const { accountId, caption } = baseTarget.call(this, itemIndex);
	const boardId = this.getNodeParameter('boardId', itemIndex, '') as string;
	if (!boardId) {
		throw new Error('Pinterest requires a Board ID. Enter the board to pin to.');
	}
	const nested = await buildNestedMedias.call(this, itemIndex);
	const target: IDataObject = {
		accountId,
		boardId,
		mediaType: nested.mediaType,
		medias: nested,
	};
	if (caption) {
		target.description = caption;
	}
	return target;
}

const PLATFORM_TARGET_KEY: Record<Platform, string> = {
	instagram: 'instagramTargets',
	x: 'twitterTargets',
	linkedin: 'linkedinTargets',
	bluesky: 'blueskyTargets',
	pinterest: 'pinterestTargets',
	tiktok: 'tiktokTargets',
	mastodon: 'mastodonTargets',
	threads: 'threadsTargets',
	facebook: 'facebookTargets',
};

const TARGET_BUILDERS: Record<Platform, (this: IExecuteFunctions, i: number) => Promise<IDataObject>> = {
	instagram: buildInstagramTarget,
	x: buildTwitterTarget,
	linkedin: buildLinkedinTarget,
	bluesky: buildBlueskyTarget,
	pinterest: buildPinterestTarget,
	tiktok: buildTiktokTarget,
	mastodon: buildMastodonTarget,
	threads: buildThreadsTarget,
	facebook: buildFacebookTarget,
};

/**
 * Build the request body for POST /posts from a publish node's parameters. The
 * platform is fixed per node, so the account is simply the selected account id
 * and the target is grouped under that platform's array. The SocialRobot API
 * requires every target array to be present (even when empty), so all nine are
 * sent; only the selected platform's array is populated.
 */
export async function buildPublishBody(
	this: IExecuteFunctions,
	itemIndex: number,
	platform: Platform,
): Promise<IDataObject> {
	const publishMode = this.getNodeParameter('publishMode', itemIndex, 'DRAFT') as string;

	const scheduledFor: IDataObject = { publish: publishMode };
	if (publishMode === 'SCHEDULE') {
		scheduledFor.date = this.getNodeParameter('scheduleDate', itemIndex) as string;
	}

	const target = await TARGET_BUILDERS[platform].call(this, itemIndex);

	const body: IDataObject = { scheduledFor };
	for (const key of Object.values(PLATFORM_TARGET_KEY)) {
		body[key] = [];
	}
	body[PLATFORM_TARGET_KEY[platform]] = [target];
	return body;
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
