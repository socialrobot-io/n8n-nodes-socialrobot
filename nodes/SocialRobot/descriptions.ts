import type { INodeProperties } from 'n8n-workflow';
import type { Platform } from './GenericFunctions';
import { publishProperties } from './publishFields';

// ---------------------------------------------------------------------------
// Resource + operation model. The SocialRobot service is exposed as ONE node:
// each platform is a Resource with a single Create (publish) operation, plus
// Post and Account management resources. This matches n8n's one-node-per-
// service pattern (Notion, HubSpot, Airtable) and keeps the field schema
// platform-dependent via displayOptions on the resource.
// ---------------------------------------------------------------------------

export const PLATFORM_LABELS: Record<Platform, string> = {
	instagram: 'Instagram',
	x: 'X (Twitter)',
	linkedin: 'LinkedIn',
	tiktok: 'TikTok',
	facebook: 'Facebook',
	pinterest: 'Pinterest',
	bluesky: 'Bluesky',
	mastodon: 'Mastodon',
	threads: 'Threads',
};

export const PUBLISH_RESOURCES: Platform[] = [
	'instagram',
	'x',
	'linkedin',
	'tiktok',
	'facebook',
	'pinterest',
	'bluesky',
	'mastodon',
	'threads',
];

/** Gate a set of fields so they only render for one resource. */
function gateForResource(fields: INodeProperties[], resource: string): INodeProperties[] {
	return fields.map((field) => ({
		...field,
		displayOptions: {
			show: {
				resource: [resource],
				...(field.displayOptions?.show ?? {}),
			},
		},
	}));
}

function platformOperation(resource: string, label: string): INodeProperties {
	return {
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: `Publish a post to ${label}`,
				description: `Publish a post to ${label} via SocialRobot`,
			},
		],
		default: 'create',
	};
}

export const resourceDescription: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{ name: 'Account', value: 'account' },
		{ name: 'Bluesky', value: 'bluesky' },
		{ name: 'Facebook', value: 'facebook' },
		{ name: 'Instagram', value: 'instagram' },
		{ name: 'LinkedIn', value: 'linkedin' },
		{ name: 'Mastodon', value: 'mastodon' },
		{ name: 'Pinterest', value: 'pinterest' },
		{ name: 'Post', value: 'post' },
		// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option -- Threads is the platform's official name and the API's platform key
		{ name: 'Threads', value: 'threads' },
		{ name: 'TikTok', value: 'tiktok' },
		{ name: 'X (Twitter)', value: 'x' },
	],
	default: 'instagram',
};

/**
 * One operation field plus the platform-specific publish fields per platform,
 * each gated on its resource so only the selected platform's fields render.
 */
export const publishDescriptions: INodeProperties[] = PUBLISH_RESOURCES.flatMap((platform) => {
	const label = PLATFORM_LABELS[platform];
	return [platformOperation(platform, label), ...gateForResource(publishProperties(platform), platform)];
});

// ---------------------------------------------------------------------------
// Shared display option filters
// ---------------------------------------------------------------------------
const showForPost = { resource: ['post'] };
const showForPostGetAll = { resource: ['post'], operation: ['getAll'] };
const showForPostReschedule = { resource: ['post'], operation: ['reschedule'] };
const showForAccount = { resource: ['account'] };

// ---------------------------------------------------------------------------
// Post resource description (management operations)
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
		default: 'get',
	},
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
