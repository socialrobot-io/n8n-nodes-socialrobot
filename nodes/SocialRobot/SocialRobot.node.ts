import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import {
	accountDescription,
	postDescription,
	publishDescriptions,
	PUBLISH_RESOURCES,
	resourceDescription,
} from './descriptions';
import { buildListQuery, buildPublishBody, type Platform } from './GenericFunctions';
import { getAccounts, socialRobotApiRequest } from './transport';

/**
 * Fetch every post across all pages when Return All is enabled. The SocialRobot
 * API paginates with a cursor, so we follow nextCursor until it stops.
 */
async function getAllPosts(this: IExecuteFunctions, qs: IDataObject): Promise<IDataObject[]> {
	const posts: IDataObject[] = [];
	let cursor: string | undefined;

	do {
		const requestQs: IDataObject = { ...qs, limit: 100 };
		if (cursor) {
			requestQs.cursor = cursor;
		}

		const response = (await socialRobotApiRequest.call(
			this,
			'GET',
			'/posts',
			{},
			requestQs,
		)) as IDataObject;

		const page = (response.posts as IDataObject[]) ?? [];
		posts.push(...page);
		cursor = response.nextCursor as string | undefined;
	} while (cursor);

	return posts;
}

export class SocialRobot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SocialRobot',
		name: 'socialRobot',
		// the SocialRobot mascot is a raster clay render with no vector source, so both themes ship PNGs; the dark variant wraps the original artwork in a white band for contrast
		icon: { light: 'file:socialrobot.png', dark: 'file:socialrobot-dark.png' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["resource"] + " - " + $parameter["operation"]}}',
		description:
			'Publish posts to Instagram, X, LinkedIn, TikTok, Facebook, Pinterest, Bluesky, Mastodon, and Threads, and manage SocialRobot posts and connected accounts',
		defaults: { name: 'SocialRobot' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'socialRobotApi', required: true }],
		properties: [
			resourceDescription,
			...publishDescriptions,
			...postDescription,
			...accountDescription,
		],
	};

	methods = {
		listSearch: { getAccounts },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: unknown;

				if (PUBLISH_RESOURCES.includes(resource as Platform)) {
					// One of the nine publish platforms: build the per-platform
					// body and create a post. The API requires every target array
					// to be present; buildPublishBody sends all nine with only
					// the selected platform's populated.
					const body = await buildPublishBody.call(this, i, resource as Platform);
					responseData = await socialRobotApiRequest.call(this, 'POST', '/posts', body);
				} else if (resource === 'account') {
					responseData = await socialRobotApiRequest.call(this, 'GET', '/accounts');
				} else if (resource === 'post' && operation === 'get') {
					const postId = this.getNodeParameter('postId', i) as string;
					responseData = await socialRobotApiRequest.call(this, 'GET', `/posts/${postId}`);
				} else if (resource === 'post' && operation === 'delete') {
					const postId = this.getNodeParameter('postId', i) as string;
					responseData = await socialRobotApiRequest.call(this, 'DELETE', `/posts/${postId}`);
				} else if (resource === 'post' && operation === 'reschedule') {
					const postId = this.getNodeParameter('postId', i) as string;
					const scheduledFor = this.getNodeParameter('scheduleDate', i) as string;
					responseData = await socialRobotApiRequest.call(
						this,
						'PATCH',
						`/posts/${postId}/schedule`,
						{ scheduledFor },
					);
				} else if (resource === 'post' && operation === 'getAll') {
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
					const qs = buildListQuery.call(this, i);
					if (returnAll) {
						responseData = await getAllPosts.call(this, qs);
					} else {
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const response = (await socialRobotApiRequest.call(
							this,
							'GET',
							'/posts',
							{},
							{ ...qs, limit },
						)) as IDataObject;
						responseData = (response.posts as IDataObject[]) ?? [];
					}
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Unknown resource/operation: ${resource}/${operation}`,
					);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject | IDataObject[]),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
