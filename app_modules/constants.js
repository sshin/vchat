"use strict";

exports.appUrl = 'http://vchat.nullcannull-dev.net/';
exports.popoutUrl = 'http://vchat.nullcannull-dev.net/popout/';
exports.publicRoomsCount = 'APP total:public_rooms';
exports.privateRoomsCount = 'APP total:private_rooms';
exports.publicRoomsRanked = 'APP public_rooms:ranked';
exports.redisVideoKeyPrefix = 'VIDEO';
exports.redisRoomKeyPrefix = 'ROOM';
exports.userCount = 'APP total:users';
exports.MAX_RELATED_VIDEOS = 50;

/** Notification types **/
exports.NOTIFICATION_NEW_VIDEO_QUEUED = 'newVideoQueued';
exports.NOTIFICATION_PLAY_NEXT_VIDEO = 'playNextVideo';
exports.NOTIFICATION_PLAY_QUEUED_VIDEO = 'playQueuedVideo';
exports.NOTIFICATION_PLAY_RELATED_VIDEO = 'playRelatedVideo';
exports.NOTIFICATION_MESSAGE = 'message';
exports.NOTIFICATION_INFO = 'info';
