import { createPublishNode } from '../SocialRobot/publish';

export class PublishThreads extends createPublishNode({
	platform: 'threads',
	name: 'socialRobotThreads',
	displayName: 'SocialRobot: Publish to Threads',
	icon: 'file:threads.png',
	iconDark: 'file:threads.dark.png',
	description: 'Publish a post to a connected Threads account using the SocialRobot API',
}) {}
