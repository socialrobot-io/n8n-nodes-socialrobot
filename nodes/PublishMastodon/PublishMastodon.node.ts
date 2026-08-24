import { createPublishNode } from '../SocialRobot/publish';

export class PublishMastodon extends createPublishNode({
	platform: 'mastodon',
	name: 'socialRobotMastodon',
	displayName: 'SocialRobot: Publish to Mastodon',
	icon: 'file:mastodon.png',
	iconDark: 'file:mastodon.dark.png',
	description: 'Publish a post to a connected Mastodon account using the SocialRobot API',
}) {}
