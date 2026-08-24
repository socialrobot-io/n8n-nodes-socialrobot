import { createPublishNode } from '../SocialRobot/publish';

export class PublishInstagram extends createPublishNode({
	platform: 'instagram',
	name: 'socialRobotInstagram',
	displayName: 'SocialRobot: Publish to Instagram',
	icon: 'file:instagram.png',
	iconDark: 'file:instagram.dark.png',
	description: 'Publish a photo or video to a connected Instagram account using the SocialRobot API',
}) {}
