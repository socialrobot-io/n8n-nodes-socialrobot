import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IconFile,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { buildPublishBody, type Platform } from './GenericFunctions';
import { publishProperties } from './publishFields';
import { makeAccountGetter, socialRobotApiRequest } from './transport';

export interface PublishNodeConfig {
	platform: Platform;
	name: string;
	displayName: string;
	icon: IconFile;
	iconDark: IconFile;
	description: string;
}

export type NodeTypeClass = new () => INodeType;

/**
 * Factory that builds a per-platform publish node. Each node shares the same
 * execute loop, credential, and account-picker plumbing; only the platform
 * (and therefore the field schema and body shape) differs.
 */
export function createPublishNode(config: PublishNodeConfig): NodeTypeClass {
	return class PublishNode implements INodeType {
		description: INodeTypeDescription = {
			displayName: config.displayName,
			name: config.name,
			icon: { light: config.icon, dark: config.iconDark },
			group: ['input'],
			version: 1,
			subtitle: 'SocialRobot',
			description: config.description,
			defaults: { name: config.displayName },
			usableAsTool: true,
			inputs: [NodeConnectionTypes.Main],
			outputs: [NodeConnectionTypes.Main],
			credentials: [{ name: 'socialRobotApi', required: true }],
			properties: publishProperties(config.platform),
		};

		methods = {
			listSearch: { getAccounts: makeAccountGetter(config.platform) },
		};

		async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
			const items = this.getInputData();
			const returnData: INodeExecutionData[] = [];

			for (let i = 0; i < items.length; i++) {
				try {
					const body = await buildPublishBody.call(this, i, config.platform);
					const responseData = await socialRobotApiRequest.call(this, 'POST', '/posts', body);
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
	};
}
