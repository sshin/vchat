"use strict";

var Constants = require('./constants');
var TaskQueueClient = require('../models/db_pool').redisTaskQueueClient;


class TaskQueue {

  /**
   * Normalize the search result to match database column names, and queue it to task queue.
   */
  static addVideos(videos, relatedToVideoId) {
    var normalized = TaskQueue.getNormalizedVideos(videos['items']);
    var data = JSON.stringify({videos: normalized});

    if (typeof relatedToVideoId !== 'undefined') {
      data['relatedToVideoId'] = relatedToVideoId;
    }

    TaskQueueClient.rpush(Constants.TASK_QUEUE_VIDEO_KEY, data);
  }

  static getNormalizedVideos(videos) {
    var normalized = [];
    for (var i = 0; i < videos.length; i++) {
      let curr = videos[i];
      normalized.push({
        video_id: curr['id']['videoId'],
        title: curr['snippet']['title'],
        description: curr['snippet']['description']
      });
    }
    return normalized;
  }
}

exports.TaskQueue = TaskQueue;
