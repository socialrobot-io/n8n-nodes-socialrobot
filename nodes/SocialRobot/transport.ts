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
 * Upload binary media to SocialRobot storage and return the resulting public
 * URL. First requests a presigned upload URL, then PUTs the raw bytes to it.
 */
export async function uploadMedia(
	this: IExecuteFunctions,
	filename: string,
	contentType: string,
	buffer: Buffer,
): Promise<string> {
	const upload = (await socialRobotApiRequest.call(this, 'POST', '/media/upload-url', {
		filename,
		contentType,
	})) as IDataObject;

	const presignedUrl = upload.presignedUrl as string | undefined;
	const url = upload.url as string | undefined;

	if (!presignedUrl) {
		throw new Error('SocialRobot did not return a presigned upload URL.');
	}

	await this.helpers.httpRequest({
		method: 'PUT',
		url: presignedUrl,
		body: buffer,
		headers: { 'Content-Type': contentType },
		json: false,
	});

	if (!url) {
		throw new Error('SocialRobot did not return a media URL after uploading.');
	}

	return url;
}

/**
 * Account resource-locator source. Lists every connected account across all
 * platforms, with the platform shown in each label. The node infers each
 * account's platform at execution time, so no platform filter is needed here.
 * The optional `filter` is the text the user types in the picker.
 */
export async function getAccounts(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const responseData = (await socialRobotApiRequest.call(
		this,
		'GET',
		'/accounts',
	)) as IDataObject[];

	let accounts = Array.isArray(responseData) ? responseData : [];

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
		const platform = (account.platform as string) || '';
		const label = [displayName, handle ? `@${handle}` : null, platform]
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
}
