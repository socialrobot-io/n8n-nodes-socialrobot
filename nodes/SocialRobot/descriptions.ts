import type { INodeProperties } from 'n8n-workflow';

// ---------------------------------------------------------------------------
// Shared display option filters
// ---------------------------------------------------------------------------
const showForPost = { resource: ['post'] };
const showForPostCreate = { resource: ['post'], operation: ['create'] };
const showForPostGetAll = { resource: ['post'], operation: ['getAll'] };
const showForPostReschedule = { resource: ['post'], operation: ['reschedule'] };
const showForAccount = { resource: ['account'] };
const showForMedia = { resource: ['media'] };

// ---------------------------------------------------------------------------
// Account resource locator (used by every platform target)
// ---------------------------------------------------------------------------
export function accountIdSelect(searchListMethod: string): INodeProperties {
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
					searchListMethod,
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. instagram-account-id-123',
			},
		],
	};
}

// ---------------------------------------------------------------------------
// Media collection (shared by the platforms that accept a `medias` array)
// ---------------------------------------------------------------------------
function mediaCollection(allowedTypes: Array<'IMAGE' | 'VIDEO' | 'GIF'>): INodeProperties {
	const typeOptions = [
		{ name: 'Image', value: 'IMAGE' },
		{ name: 'Video', value: 'VIDEO' },
		{ name: 'GIF', value: 'GIF' },
	].filter((option) => allowedTypes.includes(option.value as 'IMAGE' | 'VIDEO' | 'GIF'));

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
				displayName: 'Media Type',
				name: 'mediaType',
				type: 'options',
				default: 'IMAGE',
				options: typeOptions,
			},
			{
				displayName: 'Media URL',
				name: 'mediaUrl',
				type: 'string',
				default: '',
				description: 'Public URL of the media file',
			},
			{
				displayName: 'Alt Text',
				name: 'altText',
				type: 'string',
				default: '',
				description: 'Accessibility description for the media',
			},
		],
	};
}

// ---------------------------------------------------------------------------
// Platform target collections
// ---------------------------------------------------------------------------
const instagramTargets: INodeProperties = {
	displayName: 'Instagram Targets',
	name: 'instagramTargets',
	type: 'collection',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Instagram Target',
	},
	default: {},
	description: 'Publish this post to one or more Instagram accounts',
	displayOptions: { show: showForPostCreate },
	options: [
		{
			displayName: 'Caption',
			name: 'caption',
			type: 'string',
			typeOptions: { rows: 4 },
			default: '',
			description: 'The caption for the Instagram post',
		},
		{
			displayName: 'Cover URL',
			name: 'coverUrl',
			type: 'string',
			default: '',
			description: 'Cover image URL for video posts (optional)',
		},
		{ ...accountIdSelect('getInstagramAccounts'), displayName: 'Instagram Account' },
		{
			displayName: 'Media Type',
			name: 'mediaType',
			type: 'options',
			default: 'IMAGE',
			options: [
				{ name: 'Image', value: 'IMAGE' },
				{ name: 'Video', value: 'VIDEO' },
			],
		},
		{
			displayName: 'Media URL',
			name: 'mediaUrl',
			type: 'string',
			default: '',
			required: true,
			description: 'Public URL of the image or video to post',
		},
		{
			displayName: 'Post as Story',
			name: 'isStory',
			type: 'boolean',
			default: false,
		},
	],
};

const twitterTargets: INodeProperties = {
	displayName: 'X (Twitter) Targets',
	name: 'twitterTargets',
	type: 'collection',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add X Target',
	},
	default: {},
	description: 'Publish this post to one or more X (Twitter) accounts',
	displayOptions: { show: showForPostCreate },
	options: [
		{ ...accountIdSelect('getTwitterAccounts'), displayName: 'X Account' },
		{
			displayName: 'Text',
			name: 'caption',
			type: 'string',
			typeOptions: { rows: 4 },
			default: '',
			description: 'The text of the post (up to 280 characters)',
		},
		mediaCollection(['IMAGE', 'VIDEO', 'GIF']),
	],
};

const linkedinTargets: INodeProperties = {
	displayName: 'LinkedIn Targets',
	name: 'linkedinTargets',
	type: 'collection',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add LinkedIn Target',
	},
	default: {},
	description: 'Publish this post to one or more LinkedIn accounts or pages',
	displayOptions: { show: showForPostCreate },
	options: [
		{ ...accountIdSelect('getLinkedinAccounts'), displayName: 'LinkedIn Account' },
		{
			displayName: 'Text',
			name: 'caption',
			type: 'string',
			typeOptions: { rows: 4 },
			default: '',
			description: 'The text of the post',
		},
		mediaCollection(['IMAGE', 'VIDEO']),
		{
			displayName: 'Visibility',
			name: 'visibility',
			type: 'options',
			default: 'PUBLIC',
			options: [
				{ name: 'Public', value: 'PUBLIC' },
				{ name: 'Connections Only', value: 'CONNECTIONS' },
			],
		},
		{
			displayName: 'First Comment',
			name: 'firstComment',
			type: 'string',
			typeOptions: { rows: 2 },
			default: '',
			description: 'A comment to add right after publishing (optional)',
		},
	],
};

const blueskyTargets: INodeProperties = {
	displayName: 'Bluesky Targets',
	name: 'blueskyTargets',
	type: 'collection',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Bluesky Target',
	},
	default: {},
	description: 'Publish this post to one or more Bluesky accounts',
	displayOptions: { show: showForPostCreate },
	options: [
		{ ...accountIdSelect('getBlueskyAccounts'), displayName: 'Bluesky Account' },
		{
			displayName: 'Text',
			name: 'caption',
			type: 'string',
			typeOptions: { rows: 4 },
			default: '',
			description: 'The text of the post (up to 300 characters)',
		},
	],
};

const pinterestTargets: INodeProperties = {
	displayName: 'Pinterest Targets',
	name: 'pinterestTargets',
	type: 'collection',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Pinterest Target',
	},
	default: {},
	description: 'Publish this post to one or more Pinterest boards',
	displayOptions: { show: showForPostCreate },
	options: [
		{
			displayName: 'Board ID',
			name: 'boardId',
			type: 'string',
			default: '',
			description: 'The Pinterest board to pin to',
		},
		{
			displayName: 'Description',
			name: 'description',
			type: 'string',
			typeOptions: { rows: 3 },
			default: '',
			description: 'The pin description',
		},
		{
			displayName: 'Link',
			name: 'link',
			type: 'string',
			default: '',
			description: 'Destination URL for the pin',
		},
		{ ...accountIdSelect('getPinterestAccounts'), displayName: 'Pinterest Account' },
		{
			displayName: 'Title',
			name: 'title',
			type: 'string',
			default: '',
			description: 'The pin title',
		},
		mediaCollection(['IMAGE']),
	],
};

const tiktokTargets: INodeProperties = {
	displayName: 'TikTok Targets',
	name: 'tiktokTargets',
	type: 'collection',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add TikTok Target',
	},
	default: {},
	description: 'Publish this post to one or more TikTok accounts',
	displayOptions: { show: showForPostCreate },
	options: [
		{ ...accountIdSelect('getTiktokAccounts'), displayName: 'TikTok Account' },
		{
			displayName: 'Caption',
			name: 'caption',
			type: 'string',
			typeOptions: { rows: 4 },
			default: '',
			description: 'The caption for the TikTok post',
		},
		mediaCollection(['IMAGE', 'VIDEO']),
		{
			displayName: 'Privacy Level',
			name: 'privacyLevel',
			type: 'options',
			default: 'PUBLIC',
			options: [
				{ name: 'Public', value: 'PUBLIC' },
				{ name: 'Friends', value: 'FRIENDS' },
				{ name: 'Followers', value: 'FOLLOWERS' },
				{ name: 'Private', value: 'PRIVATE' },
			],
		},
		{
			displayName: 'Post Mode',
			name: 'postMode',
			type: 'options',
			default: 'DIRECT_POST',
			options: [
				{ name: 'Direct Post', value: 'DIRECT_POST' },
				{ name: 'Upload (Inbox Draft)', value: 'UPLOAD' },
			],
		},
	],
};

const mastodonTargets: INodeProperties = {
	displayName: 'Mastodon Targets',
	name: 'mastodonTargets',
	type: 'collection',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Mastodon Target',
	},
	default: {},
	description: 'Publish this post to one or more Mastodon accounts',
	displayOptions: { show: showForPostCreate },
	options: [
		{ ...accountIdSelect('getMastodonAccounts'), displayName: 'Mastodon Account' },
		{
			displayName: 'Text',
			name: 'caption',
			type: 'string',
			typeOptions: { rows: 4 },
			default: '',
			description: 'The text of the post',
		},
		mediaCollection(['IMAGE', 'VIDEO', 'GIF']),
		{
			displayName: 'Visibility',
			name: 'visibility',
			type: 'options',
			default: 'public',
			options: [
				{ name: 'Public', value: 'public' },
				{ name: 'Unlisted', value: 'unlisted' },
				{ name: 'Followers Only', value: 'private' },
				{ name: 'Direct', value: 'direct' },
			],
		},
	],
};

const threadsTargets: INodeProperties = {
	displayName: 'Threads Targets',
	name: 'threadsTargets',
	type: 'collection',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Threads Target',
	},
	default: {},
	description: 'Publish this post to one or more Threads accounts',
	displayOptions: { show: showForPostCreate },
	options: [
		{ ...accountIdSelect('getThreadsAccounts'), displayName: 'Threads Account' },
		{
			displayName: 'Caption',
			name: 'caption',
			type: 'string',
			typeOptions: { rows: 4 },
			default: '',
			description: 'The caption for the Threads post',
		},
		mediaCollection(['IMAGE', 'VIDEO']),
	],
};

const facebookTargets: INodeProperties = {
	displayName: 'Facebook Targets',
	name: 'facebookTargets',
	type: 'collection',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Facebook Target',
	},
	default: {},
	description: 'Publish this post to one or more Facebook pages',
	displayOptions: { show: showForPostCreate },
	options: [
		{ ...accountIdSelect('getFacebookAccounts'), displayName: 'Facebook Page' },
		{
			displayName: 'Caption',
			name: 'caption',
			type: 'string',
			typeOptions: { rows: 4 },
			default: '',
			description: 'The caption for the Facebook post (optional)',
		},
		mediaCollection(['IMAGE', 'VIDEO']),
		{
			displayName: 'Post as Reel',
			name: 'isReel',
			type: 'boolean',
			default: false,
		},
		{
			displayName: 'Post as Story',
			name: 'isStory',
			type: 'boolean',
			default: false,
		},
	],
};

// ---------------------------------------------------------------------------
// Post resource description
// ---------------------------------------------------------------------------
export const postDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForPost },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a post',
				description: 'Create a post across one or more connected platforms',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a post',
				description: 'Delete a post by ID',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a post',
				description: 'Get a single post by ID',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many posts',
				description: 'List posts with optional filters and pagination',
			},
			{
				name: 'Reschedule',
				value: 'reschedule',
				action: 'Reschedule a post',
				description: 'Change the scheduled publish time of a post',
			},
		],
		default: 'create',
	},
	// --- Create: scheduling ---
	{
		displayName: 'Schedule Type',
		name: 'publishMode',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForPostCreate },
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
		displayOptions: {
			show: { resource: ['post'], operation: ['create'], publishMode: ['SCHEDULE'] },
		},
	},
	// --- Create: platform targets ---
	instagramTargets,
	twitterTargets,
	linkedinTargets,
	blueskyTargets,
	pinterestTargets,
	tiktokTargets,
	mastodonTargets,
	threadsTargets,
	facebookTargets,
	// --- Get / Delete / Reschedule: post ID ---
	{
		displayName: 'Post ID',
		name: 'postId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the post. Use Get Many to list posts and their IDs.',
		displayOptions: {
			show: { resource: ['post'], operation: ['get', 'delete', 'reschedule'] },
		},
	},
	// --- Reschedule: new date ---
	{
		displayName: 'Schedule Date',
		name: 'scheduleDate',
		type: 'dateTime',
		default: '',
		required: true,
		description:
			'The new publish date and time. Sent as ISO 8601 with a timezone offset (for example 2026-08-20T09:00:00-03:00).',
		displayOptions: { show: showForPostReschedule },
	},
	// --- Get Many: pagination + filters ---
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: showForPostGetAll },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { ...showForPostGetAll, returnAll: [false] } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		typeOptions: { multipleValueButtonText: 'Add Filter' },
		default: {},
		description: 'Filter the posts to return',
		displayOptions: { show: showForPostGetAll },
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: '',
				options: [
					{ name: 'Draft', value: 'DRAFT' },
					{ name: 'Failed', value: 'FAILED' },
					{ name: 'None', value: '' },
					{ name: 'Partially Published', value: 'PARTIALLY_PUBLISHED' },
					{ name: 'Published', value: 'PUBLISHED' },
					{ name: 'Publishing', value: 'PUBLISHING' },
					{ name: 'Scheduled', value: 'SCHEDULED' },
				],
			},
			{
				displayName: 'Platform',
				name: 'platform',
				type: 'options',
				default: '',
				options: [
					{ name: 'Bluesky', value: 'bluesky' },
					{ name: 'Facebook', value: 'facebook' },
					{ name: 'Instagram', value: 'instagram' },
					{ name: 'LinkedIn', value: 'linkedin' },
					{ name: 'Mastodon', value: 'mastodon' },
					{ name: 'None', value: '' },
					{ name: 'Pinterest', value: 'pinterest' },
					{ name: 'Threads', value: 'threads' },
					{ name: 'TikTok', value: 'tiktok' },
					{ name: 'X (Twitter)', value: 'x' },
				],
			},
			{
				displayName: 'Scheduled From',
				name: 'dateFrom',
				type: 'dateTime',
				default: '',
				description: 'Inclusive lower bound for scheduled publication time',
			},
			{
				displayName: 'Scheduled To',
				name: 'dateTo',
				type: 'dateTime',
				default: '',
				description: 'Inclusive upper bound for scheduled publication time',
			},
		],
	},
];

// ---------------------------------------------------------------------------
// Account resource description
// ---------------------------------------------------------------------------
export const accountDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForAccount },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many accounts',
				description: 'List many connected social accounts',
			},
		],
		default: 'getAll',
	},
];

// ---------------------------------------------------------------------------
// Media resource description
// ---------------------------------------------------------------------------
export const mediaDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForMedia },
		options: [
			{
				name: 'Get Upload URL',
				value: 'getUploadUrl',
				action: 'Get an upload URL',
				description: 'Generate a presigned URL to upload media directly to SocialRobot storage',
			},
		],
		default: 'getUploadUrl',
	},
	{
		displayName: 'File Name',
		name: 'filename',
		type: 'string',
		default: '',
		required: true,
		description: 'The original filename including extension (for example photo.jpg)',
		displayOptions: {
			show: { resource: ['media'], operation: ['getUploadUrl'] },
		},
	},
	{
		displayName: 'Content Type',
		name: 'contentType',
		type: 'string',
		default: '',
		required: true,
		description: 'The MIME type that will be uploaded (for example image/jpeg or video/mp4)',
		displayOptions: {
			show: { resource: ['media'], operation: ['getUploadUrl'] },
		},
	},
];
