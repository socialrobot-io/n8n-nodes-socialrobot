const assert = require('assert');

// Build requires first: run `npm run build` before executing this script
const Generic = require('../dist/nodes/SocialRobot/GenericFunctions.js');

function makeCtx(params) {
	return {
		getNodeParameter(name, index, def) {
			const v = params[name];
			return v === undefined ? def : v;
		},
		helpers: {
			assertBinaryData() {
				throw new Error('binary path not expected in tests');
			},
			async getBinaryDataBuffer() {
				throw new Error('binary path not expected in tests');
			},
			returnJsonArray(data) {
				return Array.isArray(data) ? data : [data];
			},
			constructExecutionMetaData(data) {
				return data;
			},
		},
	};
}

async function buildBody(ctx, platform) {
	return await Generic.buildPublishBody.call(ctx, 0, platform);
}

async function testTikTokInboxDraft() {
	const ctx = makeCtx({
		accountId: 'acct1',
		caption: 'hello',
		medias: [{ mediaSource: 'url', mediaType: 'VIDEO', mediaUrl: 'https://example.com/v.mp4' }],
		postMode: 'UPLOAD',
	});
	const body = await buildBody(ctx, 'tiktok');
	const target = body.tiktokTargets[0];
	assert.strictEqual(target.postMode, 'UPLOAD');
	assert.ok(!('privacyLevel' in target), 'privacyLevel should not be sent for inbox uploads');
	assert.ok(!('disableComment' in target), 'interaction fields should not be sent for inbox uploads');
}

async function testTikTokDirectPostWithPrivacy() {
	const ctx = makeCtx({
		accountId: 'acct1',
		caption: 'hello',
		medias: [{ mediaSource: 'url', mediaType: 'VIDEO', mediaUrl: 'https://example.com/v.mp4' }],
		postMode: 'DIRECT_POST',
		privacyLevel: 'PUBLIC',
		isAigc: true,
		allowComment: false,
		allowDuet: false,
		allowStitch: false,
	});
	const body = await buildBody(ctx, 'tiktok');
	const target = body.tiktokTargets[0];
	assert.strictEqual(target.postMode, 'DIRECT_POST');
	assert.strictEqual(target.privacyLevel, 'PUBLIC');
	assert.strictEqual(target.isAigc, true);
	assert.strictEqual(target.disableComment, true, 'allowComment=false → disableComment=true');
	assert.strictEqual(target.disableDuet, true, 'allowDuet=false → disableDuet=true');
	assert.strictEqual(target.disableStitch, true, 'allowStitch=false → disableStitch=true');
}

async function testInstagramReel() {
	const ctx = makeCtx({
		resource: 'instagram',
		accountId: 'acct1',
		caption: 'ig',
		mediaSource: 'url',
		mediaType: 'VIDEO',
		mediaUrl: 'https://example.com/v.mp4',
		isReel: true,
	});
	const body = await buildBody(ctx, 'instagram');
	const target = body.instagramTargets[0];
	assert.strictEqual(target.isReel, true);
}

async function testFacebookReel() {
	const ctx = makeCtx({
		accountId: 'acct1',
		caption: 'fb',
		isReel: true,
		medias: [{ mediaSource: 'url', mediaType: 'VIDEO', mediaUrl: 'https://example.com/v.mp4' }],
	});
	const body = await buildBody(ctx, 'facebook');
	const target = body.facebookTargets[0];
	assert.strictEqual(target.isReel, true);
}

async function testFacebookReelInvalid() {
	const ctx = makeCtx({
		accountId: 'acct1',
		caption: 'fb',
		isReel: true,
		medias: [{ mediaSource: 'url', mediaType: 'IMAGE', mediaUrl: 'https://example.com/i.jpg' }],
	});
	let caught = false;
	try {
		await buildBody(ctx, 'facebook');
	} catch (e) {
		caught = String(e.message || e).includes('Facebook Reels need exactly one video');
	}
	assert.ok(caught, 'Expected Facebook Reel validation error');
}

async function testTikTokDirectMissingPrivacy() {
	const ctx = makeCtx({
		accountId: 'acct1',
		caption: 'hi',
		postMode: 'DIRECT_POST',
		privacyLevel: '',
		medias: [{ mediaSource: 'url', mediaType: 'VIDEO', mediaUrl: 'https://example.com/v.mp4' }],
	});
	let caught = false;
	try {
		await buildBody(ctx, 'tiktok');
	} catch (e) {
		caught = String(e.message || e).includes('Direct Post needs a Privacy Level');
	}
	assert.ok(caught, 'Expected TikTok missing privacy validation error');
}

async function testTikTokVideoMultipleFiles() {
	const ctx = makeCtx({
		accountId: 'acct1',
		caption: 'hi',
		postMode: 'UPLOAD',
		medias: [
			{ mediaSource: 'url', mediaType: 'VIDEO', mediaUrl: 'https://example.com/v1.mp4' },
			{ mediaSource: 'url', mediaType: 'VIDEO', mediaUrl: 'https://example.com/v2.mp4' },
		],
	});
	let caught = false;
	try {
		await buildBody(ctx, 'tiktok');
	} catch (e) {
		caught = String(e.message || e).includes('TikTok video posts take exactly one video');
	}
	assert.ok(caught, 'Expected TikTok single video validation error');
}

async function run() {
	await testTikTokInboxDraft();
	await testTikTokDirectPostWithPrivacy();
	await testInstagramReel();
	await testFacebookReel();
	await testFacebookReelInvalid();
	await testTikTokDirectMissingPrivacy();
	await testTikTokVideoMultipleFiles();
	console.log('All request-body tests passed.');
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});

