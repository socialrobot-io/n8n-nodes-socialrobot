import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';

type ApiRequestFunctions = IExecuteFunctions | ILoadOptionsFunctions;

const DEFAULT_BASE_URL = 'https://socialrobot.io/api';

/**
 * Shared request helper used by both the node execution and the account
 * resource locator (list search). It reads the base URL from the SocialRobot
 * credential and authenticates via the x-api-key header configured there.
 */
export async function socialRobotApiRequest(
	this: ApiRequestFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	const credentials = await this.getCredentials('socialRobotApi');

	const baseUrl = ((credentials.baseUrl as string) || DEFAULT_BASE_URL).replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${resource}`,
		json: true,
	};

	if (Object.keys(body).length > 0) {
		options.body = body;
	}
	if (Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	return this.helpers.httpRequestWithAuthentication.call(this, 'socialRobotApi', options);
}

/**
 * List search source for the account resource locator. Returns the connected
 * accounts for the authenticated user so workflows can pick accounts by name.
 */
export async function getAccountsListSearch(
	this: ILoadOptionsFunctions,
): Promise<INodeListSearchResult> {
	const responseData = (await socialRobotApiRequest.call(
		this,
		'GET',
		'/accounts',
	)) as IDataObject[];

	const accounts = Array.isArray(responseData) ? responseData : [];

	const results: INodeListSearchItems[] = accounts.map((account) => {
		const displayName = (account.displayName as string) || '';
		const handle = (account.handle as string) || '';
		const platform = (account.platform as string) || '';
		const label = [displayName, handle].filter(Boolean).join(' · ') || (account.id as string);

		return {
			name: label,
			value: account.id as string,
			description: platform,
			url: (account.profileImage as string) || undefined,
		};
	});

	return { results };
}
