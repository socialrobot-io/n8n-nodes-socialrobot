import { createPublishNode } from '../SocialRobot/publish';

export class PublishTikTok extends createPublishNode({
	platform: 'tiktok',
	name: 'socialRobotTiktok',
	displayName: 'SocialRobot: Publish to TikTok',
	icon: 'file:tiktok.png',
	iconDark: 'file:tiktok.dark.png',
	description: 'Publish a video or photo to a connected TikTok account using the SocialRobot API',
}) {}
