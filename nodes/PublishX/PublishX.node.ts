import { createPublishNode } from '../SocialRobot/publish';

export class PublishX extends createPublishNode({
	platform: 'x',
	name: 'socialRobotX',
	displayName: 'SocialRobot: Publish to X (Twitter)',
	icon: 'file:x.png',
	iconDark: 'file:x.dark.png',
	description: 'Publish a post to a connected X (Twitter) account using the SocialRobot API',
}) {}
