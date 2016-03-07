"use strict";

var Constants = require('./constants');
var TaskQueueClient = require('../models/db_pool').redisTaskQueueClient;


class TaskQueue {

  /**
   * Normalize the search result to match database column names, and queue it to task queue.
   */
  static addVideos(videos) {
    var normalized = new TaskQueue()._getNormalizedVideos(videos);
    var data = JSON.stringify({videos: normalized});
    TaskQueueClient.rpush(Constants.TASK_QUEUE_VIDEO_KEY, data);
  }

  static addRelatedVideos(videos, relatedToVideoId) {
    var normalized = new TaskQueue()._getNormalizedVideos({items: videos});
    var data = JSON.stringify({
      videos: normalized,
      relatedToVideoId: relatedToVideoId
    });
    TaskQueueClient.rpush(Constants.TASK_QUEUE_VIDEO_KEY, data);
  }

  _getNormalizedVideos(videos) {
    var normalized = [];
    for (var i = 0; i < videos['items'].length; i++) {
      let curr = videos['items'][i];
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
