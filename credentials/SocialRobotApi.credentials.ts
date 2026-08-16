import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class SocialRobotApi implements ICredentialType {
	name = 'socialRobotApi';

	displayName = 'SocialRobot API';

	icon: Icon = {
		light: 'file:../nodes/SocialRobot/socialrobot.png',
		dark: 'file:../nodes/SocialRobot/socialrobot.dark.png',
	};

	documentationUrl = 'https://socialrobot.io';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your SocialRobot API key. Create one under Scheduler → API Keys in the SocialRobot app.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://socialrobot.io/api',
			description:
				'The SocialRobot API base URL. Leave the default for the hosted service, or point this at a self-hosted or development instance.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			url: '={{$credentials.baseUrl}}/accounts',
			method: 'GET',
		},
	};
}
