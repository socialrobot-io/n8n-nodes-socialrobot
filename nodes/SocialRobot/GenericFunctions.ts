import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

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

/**
 * Map a `medias` collection value into the array shape the SocialRobot API
 * expects: [{ mediaType, mediaUrl, altText? }].
 */
function buildMedias(value: unknown): IDataObject[] {
	return toItems(value).map((media) => {
		const item: IDataObject = {
			mediaType: media.mediaType ?? 'IMAGE',
			mediaUrl: media.mediaUrl ?? '',
		};
		if (media.altText) {
			item.altText = media.altText;
		}
		return item;
	});
}

/**
 * Build the request body for POST /posts from the node's create-post
 * parameters.
 */
export function buildCreateBody(this: IExecuteFunctions): IDataObject {
	const publishMode = this.getNodeParameter('publishMode', 0) as string;

	const scheduledFor: IDataObject = { publish: publishMode };
	if (publishMode === 'SCHEDULE') {
		scheduledFor.date = this.getNodeParameter('scheduleDate', 0) as string;
	}

	const body: IDataObject = { scheduledFor };

	body.instagramTargets = toItems(this.getNodeParameter('instagramTargets', 0, [])).map((t) => {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			caption: (t.caption as string) ?? '',
			mediaType: (t.mediaType as string) ?? 'IMAGE',
			mediaUrl: (t.mediaUrl as string) ?? '',
		};
		if (t.isStory) {
			target.isStory = true;
		}
		if ((t.mediaType as string) === 'VIDEO' && t.coverUrl) {
			target.coverUrl = t.coverUrl;
		}
		return target;
	});

	body.twitterTargets = toItems(this.getNodeParameter('twitterTargets', 0, [])).map((t) => ({
		accountId: extractId(t.accountId),
		caption: (t.caption as string) ?? '',
		medias: buildMedias(t.medias),
	}));

	body.linkedinTargets = toItems(this.getNodeParameter('linkedinTargets', 0, [])).map((t) => {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			caption: (t.caption as string) ?? '',
			medias: buildMedias(t.medias),
		};
		if (t.visibility) {
			target.visibility = t.visibility;
		}
		if (t.firstComment) {
			target.firstComment = t.firstComment;
		}
		return target;
	});

	body.blueskyTargets = toItems(this.getNodeParameter('blueskyTargets', 0, [])).map((t) => ({
		accountId: extractId(t.accountId),
		caption: (t.caption as string) ?? '',
	}));

	body.pinterestTargets = toItems(this.getNodeParameter('pinterestTargets', 0, [])).map((t) => {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			boardId: (t.boardId as string) ?? '',
			mediaType: 'IMAGE',
			medias: buildMedias(t.medias),
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
	});

	body.tiktokTargets = toItems(this.getNodeParameter('tiktokTargets', 0, [])).map((t) => {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			caption: (t.caption as string) ?? '',
			medias: buildMedias(t.medias),
		};
		if (t.privacyLevel) {
			target.privacyLevel = t.privacyLevel;
		}
		if (t.postMode) {
			target.postMode = t.postMode;
		}
		return target;
	});

	body.mastodonTargets = toItems(this.getNodeParameter('mastodonTargets', 0, [])).map((t) => {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			caption: (t.caption as string) ?? '',
			medias: buildMedias(t.medias),
		};
		if (t.visibility) {
			target.visibility = t.visibility;
		}
		return target;
	});

	body.threadsTargets = toItems(this.getNodeParameter('threadsTargets', 0, [])).map((t) => ({
		accountId: extractId(t.accountId),
		caption: (t.caption as string) ?? '',
		medias: buildMedias(t.medias),
	}));

	body.facebookTargets = toItems(this.getNodeParameter('facebookTargets', 0, [])).map((t) => {
		const target: IDataObject = {
			accountId: extractId(t.accountId),
			medias: buildMedias(t.medias),
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
	});

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
