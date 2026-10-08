import type { INodeProperties } from 'n8n-workflow';
import type { Platform } from './GenericFunctions';

export function accountField(): INodeProperties {
	return {
		displayName: 'Account',
		name: 'accountId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The connected SocialRobot account to publish to',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select an account...',
				typeOptions: {
					searchListMethod: 'getAccounts',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. account-id-123',
			},
		],
	};
}

export function captionField(description = 'The post text or caption.'): INodeProperties {
	return {
		displayName: 'Caption',
		name: 'caption',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		description,
	};
}

export function boardIdField(): INodeProperties {
	return {
		displayName: 'Pinterest Board ID',
		name: 'boardId',
		type: 'string',
		default: '',
		required: true,
		description: 'The Pinterest board to pin to',
	};
}

function mediaTypeOptions(includeGif: boolean): Array<{ name: string; value: string }> {
	const options: Array<{ name: string; value: string }> = [];
	if (includeGif) {
		options.push({ name: 'GIF', value: 'GIF' });
	}
	options.push({ name: 'Image', value: 'IMAGE' }, { name: 'Video', value: 'VIDEO' });
	return options;
}

function mediaSourceOptions(): Array<{ name: string; value: string }> {
	return [
		{ name: 'By URL', value: 'url' },
		{ name: 'From Binary Data', value: 'binary' },
	];
}

/**
 * Multi-media collection used by every platform that accepts a list of media
 * entries (X, Threads, Facebook, TikTok, LinkedIn, Pinterest, Mastodon). Only X
 * accepts GIF, so the media type options are narrowed per platform.
 */
export function mediaCollection(includeGif: boolean): INodeProperties {
	return {
		displayName: 'Media',
		name: 'medias',
		type: 'collection',
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: 'Add Media',
		},
		default: {},
		description: 'Media files to attach to this post',
		options: [
			{
				displayName: 'Alt Text',
				name: 'altText',
				type: 'string',
				default: '',
				description: 'Accessibility description for the media',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description:
					'Name of the binary property on the input item that holds the media (for example "data"). The file is uploaded to SocialRobot automatically.',
				displayOptions: { show: { mediaSource: ['binary'] } },
			},
			{
				displayName: 'Media Source',
				name: 'mediaSource',
				type: 'options',
				default: 'url',
				description: 'Attach the media from a public URL or from binary data on the input item',
				options: mediaSourceOptions(),
			},
			{
				displayName: 'Media Type',
				name: 'mediaType',
				type: 'options',
				default: 'IMAGE',
				description: 'The media format',
				options: mediaTypeOptions(includeGif),
			},
			{
				displayName: 'Media URL',
				name: 'mediaUrl',
				type: 'string',
				default: '',
				description: 'Public URL of the media file',
				displayOptions: { show: { mediaSource: ['url'] } },
			},
		],
	};
}

/** Flat single-media fields used by Instagram (one image or video per post). */
export function instagramMediaFields(): INodeProperties[] {
	return [
		{
			displayName: 'Media Source',
			name: 'mediaSource',
			type: 'options',
			default: 'url',
			description: 'Attach the media from a public URL or from binary data on the input item',
			options: mediaSourceOptions(),
		},
		{
			displayName: 'Media Type',
			name: 'mediaType',
			type: 'options',
			default: 'IMAGE',
			description: 'The media format. Instagram accepts images and videos.',
			options: mediaTypeOptions(false),
		},
		{
			displayName: 'Media URL',
			name: 'mediaUrl',
			type: 'string',
			default: '',
			description: 'Public URL of the media file',
			displayOptions: { show: { mediaSource: ['url'] } },
		},
		{
			displayName: 'Binary Property',
			name: 'binaryPropertyName',
			type: 'string',
			default: 'data',
			description:
				'Name of the binary property on the input item that holds the media (for example "data"). The file is uploaded to SocialRobot automatically.',
			displayOptions: { show: { mediaSource: ['binary'] } },
		},
	];
}

/**
 * TikTok publish options (3.1). Field names and enums mirror the SocialRobot
 * REST API (`tiktokTargets[]` / `POST /tiktok/create`). Privacy, interaction
 * and AI-label settings only apply to Direct Post: inbox uploads are finished
 * in the TikTok app, so the API does not send them.
 */
export function tiktokFields(): INodeProperties[] {
	const directPostOnly = { show: { postMode: ['DIRECT_POST'] } };
	return [
		{
			displayName: 'Post Mode',
			name: 'postMode',
			type: 'options',
			noDataExpression: true,
			options: [
				{
					name: 'Direct Post',
					value: 'DIRECT_POST',
					description: 'Publish to the TikTok profile when the post runs',
				},
				{
					name: 'Send to Inbox (Draft)',
					value: 'UPLOAD',
					description:
						'Send the media to the TikTok inbox as a draft. The creator finishes and posts it in the TikTok app.',
				},
			],
			default: 'UPLOAD',
			description: 'How SocialRobot hands the post to TikTok',
		},
		{
			displayName:
				"By posting, you agree to TikTok's Music Usage Confirmation. TikTok may take a few minutes to process the post before it shows on the profile.",
			name: 'tiktokDirectPostNotice',
			type: 'notice',
			default: '',
			displayOptions: directPostOnly,
		},
		{
			displayName: 'Privacy Level',
			name: 'privacyLevel',
			type: 'options',
			required: true,
			options: [
				{ name: 'Followers', value: 'FOLLOWERS' },
				{ name: 'Friends', value: 'FRIENDS' },
				{ name: 'Private (Only Me)', value: 'PRIVATE' },
				{ name: 'Public (Everyone)', value: 'PUBLIC' },
			],
			// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options -- TikTok requires an explicit privacy choice with no preselected value
			default: '',
			description:
				'Who can see the post. Must be one of the options TikTok allows for this account (creator info). Required for Direct Post.',
			displayOptions: directPostOnly,
		},
		{
			displayName: 'AI-Generated Content',
			name: 'isAigc',
			type: 'boolean',
			default: false,
			description:
				'Whether TikTok labels the video "Creator labeled as AI-generated". Video Direct Post only. For inbox drafts, turn the label on in the TikTok app.',
			displayOptions: directPostOnly,
		},
		{
			displayName: 'Allow Comments',
			name: 'allowComment',
			type: 'boolean',
			default: false,
			description: 'Whether to allow comments on this post (off by default per TikTok guidelines)',
			displayOptions: directPostOnly,
		},
		{
			displayName: 'Allow Duet',
			name: 'allowDuet',
			type: 'boolean',
			default: false,
			description: 'Whether to allow Duet. Videos only (off by default per TikTok guidelines).',
			displayOptions: directPostOnly,
		},
		{
			displayName: 'Allow Stitch',
			name: 'allowStitch',
			type: 'boolean',
			default: false,
			description: 'Whether to allow Stitch. Videos only (off by default per TikTok guidelines).',
			displayOptions: directPostOnly,
		},
		{
			displayName: 'Title',
			name: 'title',
			type: 'string',
			default: '',
			description: 'Title for photo (slideshow) posts, up to 90 characters. Leave empty for videos.',
		},
	];
}

/** "Post as Reel" toggle for Instagram videos and Facebook (3.1). Maps to `isReel`. */
export function reelField(platform: 'instagram' | 'facebook'): INodeProperties {
	const field: INodeProperties = {
		displayName: 'Post as Reel',
		name: 'isReel',
		type: 'boolean',
		default: false,
		description:
			platform === 'instagram'
				? 'Whether to publish the video as an Instagram Reel instead of a feed video'
				: 'Whether to publish as a Facebook Reel. Needs exactly one vertical video of 3-90 seconds.',
	};
	if (platform === 'instagram') {
		field.displayOptions = { show: { mediaType: ['VIDEO'] } };
	}
	return field;
}

export function schedulingFields(): INodeProperties[] {
	return [
		{
			displayName: 'Schedule Type',
			name: 'publishMode',
			type: 'options',
			noDataExpression: true,
			options: [
				{ name: 'Draft', value: 'DRAFT', description: 'Save as a draft without publishing' },
				{ name: 'Publish Now', value: 'NOW', description: 'Publish immediately' },
				{
					name: 'Schedule',
					value: 'SCHEDULE',
					description: 'Publish at a specific date and time',
				},
			],
			default: 'DRAFT',
		},
		{
			displayName: 'Schedule Date',
			name: 'scheduleDate',
			type: 'dateTime',
			default: '',
			description:
				'The date and time to publish. Sent as ISO 8601 with a timezone offset (for example 2026-08-20T09:00:00-03:00).',
			displayOptions: { show: { publishMode: ['SCHEDULE'] } },
		},
	];
}

/**
 * Build the parameter list for a publish node. The platform fixes which
 * platform-specific fields appear, so no conditional gating is needed.
 */
export function publishProperties(platform: Platform): INodeProperties[] {
	const fields: INodeProperties[] = [accountField()];

	switch (platform) {
		case 'bluesky':
			fields.push(captionField());
			break;
		case 'instagram':
			fields.push(captionField(), ...instagramMediaFields(), reelField('instagram'));
			break;
		case 'tiktok':
			fields.push(captionField(), mediaCollection(false), ...tiktokFields());
			break;
		case 'facebook':
			fields.push(captionField(), mediaCollection(false), reelField('facebook'));
			break;
		case 'pinterest':
			fields.push(boardIdField(), captionField('The pin description.'), mediaCollection(false));
			break;
		case 'x':
			fields.push(captionField(), mediaCollection(true));
			break;
		default:
			// linkedin, mastodon, threads
			fields.push(captionField(), mediaCollection(false));
			break;
	}

	fields.push(...schedulingFields());
	return fields;
}
