import { createPublishNode } from '../SocialRobot/publish';

export class PublishLinkedIn extends createPublishNode({
	platform: 'linkedin',
	name: 'socialRobotLinkedin',
	displayName: 'SocialRobot: Publish to LinkedIn',
	icon: 'file:linkedin.png',
	iconDark: 'file:linkedin.dark.png',
	description: 'Publish a post to a connected LinkedIn account using the SocialRobot API',
}) {}
