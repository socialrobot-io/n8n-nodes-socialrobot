import { createPublishNode } from '../SocialRobot/publish';

export class PublishFacebook extends createPublishNode({
	platform: 'facebook',
	name: 'socialRobotFacebook',
	displayName: 'SocialRobot: Publish to Facebook',
	icon: 'file:facebook.png',
	iconDark: 'file:facebook.dark.png',
	description: 'Publish a post to a connected Facebook account using the SocialRobot API',
}) {}
