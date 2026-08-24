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
			fields.push(captionField(), ...instagramMediaFields());
			break;
		case 'pinterest':
			fields.push(boardIdField(), captionField('The pin description.'), mediaCollection(false));
			break;
		case 'x':
			fields.push(captionField(), mediaCollection(true));
			break;
		default:
			// linkedin, tiktok, mastodon, threads, facebook
			fields.push(captionField(), mediaCollection(false));
			break;
	}

	fields.push(...schedulingFields());
	return fields;
}
