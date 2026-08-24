import { createPublishNode } from '../SocialRobot/publish';

export class PublishPinterest extends createPublishNode({
	platform: 'pinterest',
	name: 'socialRobotPinterest',
	displayName: 'SocialRobot: Publish to Pinterest',
	icon: 'file:pinterest.png',
	iconDark: 'file:pinterest.dark.png',
	description: 'Publish a pin to a connected Pinterest account using the SocialRobot API',
}) {}
