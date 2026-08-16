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
 * Build a list-search source that only surfaces connected accounts for a
 * single platform, so an Instagram target only offers Instagram accounts and
 * an X target only offers X accounts. The optional `filter` is the text the
 * user types in the picker.
 */
function getAccountsListSearchFactory(platform: string) {
	return async function (
		this: ILoadOptionsFunctions,
		filter?: string,
	): Promise<INodeListSearchResult> {
		const responseData = (await socialRobotApiRequest.call(
			this,
			'GET',
			'/accounts',
		)) as IDataObject[];

		let accounts = Array.isArray(responseData) ? responseData : [];
		accounts = accounts.filter((account) => account.platform === platform);

		if (filter) {
			const needle = filter.toLowerCase();
			accounts = accounts.filter((account) =>
				[account.displayName, account.handle, account.platform].some((value) =>
					String(value ?? '')
						.toLowerCase()
						.includes(needle),
				),
			);
		}

		const results: INodeListSearchItems[] = accounts.map((account) => {
			const displayName = (account.displayName as string) || '';
			const handle = (account.handle as string) || '';
			const label = [displayName, handle ? `@${handle}` : null]
				.filter(Boolean)
				.join(' · ');

			return {
				name: label || (account.id as string),
				value: account.id as string,
				description: platform,
				url: (account.profileImage as string) || undefined,
			};
		});

		return { results };
	};
}

export const getInstagramAccounts = getAccountsListSearchFactory('instagram');
export const getPinterestAccounts = getAccountsListSearchFactory('pinterest');
export const getTwitterAccounts = getAccountsListSearchFactory('x');
export const getLinkedinAccounts = getAccountsListSearchFactory('linkedin');
export const getBlueskyAccounts = getAccountsListSearchFactory('bluesky');
export const getTiktokAccounts = getAccountsListSearchFactory('tiktok');
export const getMastodonAccounts = getAccountsListSearchFactory('mastodon');
export const getThreadsAccounts = getAccountsListSearchFactory('threads');
export const getFacebookAccounts = getAccountsListSearchFactory('facebook');
