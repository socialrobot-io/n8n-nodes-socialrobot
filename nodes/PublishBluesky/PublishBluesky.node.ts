import { createPublishNode } from '../SocialRobot/publish';

export class PublishBluesky extends createPublishNode({
	platform: 'bluesky',
	name: 'socialRobotBluesky',
	displayName: 'SocialRobot: Publish to Bluesky',
	icon: 'file:bluesky.png',
	iconDark: 'file:bluesky.dark.png',
	description: 'Publish a text post to a connected Bluesky account using the SocialRobot API',
}) {}
