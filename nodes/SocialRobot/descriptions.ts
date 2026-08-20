import type { INodeProperties } from 'n8n-workflow';

// ---------------------------------------------------------------------------
// Shared display option filters
// ---------------------------------------------------------------------------
const showForPost = { resource: ['post'] };
const showForPostCreate = { resource: ['post'], operation: ['create'] };
const showForPostGetAll = { resource: ['post'], operation: ['getAll'] };
const showForPostReschedule = { resource: ['post'], operation: ['reschedule'] };
const showForAccount = { resource: ['account'] };

// Platforms that publish a single text/caption (no dedicated title+description).
const TEXT_PLATFORMS = [
	'instagram',
	'x',
	'linkedin',
	'bluesky',
	'tiktok',
	'mastodon',
	'threads',
	'facebook',
];

// Platforms that attach media through a `medias` array.
const MEDIA_PLATFORMS = ['x', 'linkedin', 'pinterest', 'tiktok', 'mastodon', 'threads', 'facebook'];

// ---------------------------------------------------------------------------
// Shared media collection (attaches a `medias` array to a target)
// ---------------------------------------------------------------------------
const mediaCollection: INodeProperties = {
	displayName: 'Media',
	name: 'medias',
	type: 'collection',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Media',
	},
	default: {},
	description: 'Media files to attach to this post',
	displayOptions: { show: { platform: MEDIA_PLATFORMS } },
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
			options: [
				{ name: 'By URL', value: 'url' },
				{ name: 'From Binary Data', value: 'binary' },
			],
		},
		{
			displayName: 'Media Type',
			name: 'mediaType',
			type: 'options',
			default: 'IMAGE',
			description: 'The media format. Not every platform accepts every type (GIF is only supported on X and Mastodon).',
			options: [
				{ name: 'Image', value: 'IMAGE' },
				{ name: 'Video', value: 'VIDEO' },
				{ name: 'GIF', value: 'GIF' },
			],
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

// ---------------------------------------------------------------------------
// Create Post: single "Targets" collection (one Add Target button for every
// platform; the platform field drives which fields show and which account list
// the picker loads)
// ---------------------------------------------------------------------------
const targets: INodeProperties = {
	displayName: 'Targets',
	name: 'targets',
	type: 'collection',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Target',
	},
	default: {},
	description: 'Publish this post to one or more accounts or pages across any connected platform',
	displayOptions: { show: showForPostCreate },
	options: [
		{
			displayName: 'Account',
			name: 'accountId',
			type: 'resourceLocator',
			default: { mode: 'list', value: '' },
			description: 'The connected SocialRobot account to publish to. Filtered to the platform selected above.',
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
					placeholder: 'e.g. instagram-account-id-123',
				},
			],
		},
		{
			displayName: 'Audience',
			name: 'postVisibility',
			type: 'options',
			default: 'PUBLIC',
			description: 'Who can see this LinkedIn post',
			options: [
				{ name: 'Public', value: 'PUBLIC' },
				{ name: 'Connections Only', value: 'CONNECTIONS' },
			],
			displayOptions: { show: { platform: ['linkedin'] } },
		},
		{
			displayName: 'Binary Property',
			name: 'binaryPropertyName',
			type: 'string',
			default: 'data',
			description:
				'Name of the binary property on the input item that holds the media (for example "data"). The file is uploaded to SocialRobot automatically.',
			displayOptions: { show: { platform: ['instagram'], mediaSource: ['binary'] } },
		},
		{
			displayName: 'Board ID',
			name: 'boardId',
			type: 'string',
			default: '',
			description: 'The Pinterest board to pin to',
			displayOptions: { show: { platform: ['pinterest'] } },
		},
		{
			displayName: 'Caption',
			name: 'caption',
			type: 'string',
			typeOptions: { rows: 4 },
			default: '',
			description: 'The text or caption of the post',
			displayOptions: { show: { platform: TEXT_PLATFORMS } },
		},
		{
			displayName: 'Cover URL',
			name: 'coverUrl',
			type: 'string',
			default: '',
			description: 'Cover image URL for Instagram video posts (optional)',
			displayOptions: { show: { platform: ['instagram'], mediaType: ['VIDEO'] } },
		},
		{
			displayName: 'Description',
			name: 'description',
			type: 'string',
			typeOptions: { rows: 3 },
			default: '',
			description: 'The pin description',
			displayOptions: { show: { platform: ['pinterest'] } },
		},
		{
			displayName: 'First Comment',
			name: 'firstComment',
			type: 'string',
			typeOptions: { rows: 2 },
			default: '',
			description: 'A comment to add right after publishing (optional)',
			displayOptions: { show: { platform: ['linkedin'] } },
		},
		{
			displayName: 'Link',
			name: 'link',
			type: 'string',
			default: '',
			description: 'Destination URL for the pin',
			displayOptions: { show: { platform: ['pinterest'] } },
		},
		mediaCollection,
		{
			displayName: 'Media Source',
			name: 'mediaSource',
			type: 'options',
			default: 'url',
			description: 'Attach the media from a public URL or from binary data on the input item',
			options: [
				{ name: 'By URL', value: 'url' },
				{ name: 'From Binary Data', value: 'binary' },
			],
			displayOptions: { show: { platform: ['instagram'] } },
		},
		{
			displayName: 'Media Type',
			name: 'mediaType',
			type: 'options',
			default: 'IMAGE',
			options: [
				{ name: 'Image', value: 'IMAGE' },
				{ name: 'Video', value: 'VIDEO' },
			],
			displayOptions: { show: { platform: ['instagram'] } },
		},
		{
			displayName: 'Media URL',
			name: 'mediaUrl',
			type: 'string',
			default: '',
			description:
				'Public URL of the image or video to post. Required when Media Source is By URL.',
			displayOptions: { show: { platform: ['instagram'], mediaSource: ['url'] } },
		},
		{
			displayName: 'Platform',
			name: 'platform',
			type: 'options',
			noDataExpression: true,
			options: [
				{ name: 'Bluesky', value: 'bluesky' },
				{ name: 'Facebook', value: 'facebook' },
				{ name: 'Instagram', value: 'instagram' },
				{ name: 'LinkedIn', value: 'linkedin' },
				{ name: 'Mastodon', value: 'mastodon' },
				{ name: 'Pinterest', value: 'pinterest' },
				{ name: 'Threads', value: 'threads' },
				{ name: 'TikTok', value: 'tiktok' },
				{ name: 'X (Twitter)', value: 'x' },
			],
			default: 'instagram',
			description: 'The platform to publish this target to',
		},
		{
			displayName: 'Post as Reel',
			name: 'isReel',
			type: 'boolean',
			default: false,
			description: 'Whether to publish this Facebook post as a Reel',
			displayOptions: { show: { platform: ['facebook'] } },
		},
		{
			displayName: 'Post as Story',
			name: 'isStory',
			type: 'boolean',
			default: false,
			description: 'Whether to publish this post as a Story',
			displayOptions: { show: { platform: ['instagram', 'facebook'] } },
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
			displayOptions: { show: { platform: ['tiktok'] } },
		},
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
			displayOptions: { show: { platform: ['tiktok'] } },
		},
		{
			displayName: 'Title',
			name: 'title',
			type: 'string',
			default: '',
			description: 'The pin title',
			displayOptions: { show: { platform: ['pinterest'] } },
		},
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
			displayOptions: { show: { platform: ['mastodon'] } },
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
	// --- Create: targets ---
	targets,
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
