var redis = require('redis');
var Constants = require('./app_modules/constants');
var redisClient = require('./models/db_pool').redisTaskQueueClient;
var Video = require('./models/video').Video;
var RelatedVideo = require('./models/related_video').RelatedVideo;
var video = new Video();
var relatedVideo = new RelatedVideo();

var relatedVideosSaved = 0;

function watchTaskQueue() {
  redisClient.blpop(Constants.TASK_QUEUE_VIDEO_KEY, 0, processData);
}

watchTaskQueue();



function processData(err, rawData) {
  if (err) {
    watchTaskQueue();
    return;
  }

  var key = rawData[0];
  var data = JSON.parse(rawData[1]);
  var relatedToVideoId = data.hasOwnProperty('relatedToVideoId') ? data['relatedToVideoId'] : null;
  var videos = data['videos'];

  if (relatedToVideoId !== null) {
    saveRelatedVideos(videos, relatedToVideoId);
  } else {
    saveVideos(videos);
  }
}

function saveVideos(videos) {
  var i = 0;
  (function saveVideos(i) {
    if (i === videos.length) {
      watchTaskQueue();
    } else {
      video.saveVideo(videos[i]).then(() => {
        saveVideos(i+1);
      }).catch(() => {
        saveVideos(i+1);
      });
    }
  })(i);
}

function saveRelatedVideos(videos, relatedToVideoId) {
  var i = 0;
  var data = {related_video_id: relatedToVideoId};
  (function saveRelatedVideos(i) {
    if (i === videos.length) {
      processRelatedVideos(videos);
    } else {
      data['video_id'] = videos[i]['video_id'];
      relatedVideo.saveVideo(data).then(() => {
        saveRelatedVideos(i+1);
      }).catch(() => {
        saveRelatedVideos(i+1);
      });
    }
  })(i);
}

function processRelatedVideos(videos) {
  relatedVideosSaved++;
  if (relatedVideosSaved === 10) {
    relatedVideosSaved = 0;
    relatedVideo.updateScores().then(() => {
      relatedVideo.deleteDuplicates().then(() => saveVideos(videos));
    });
  } else {
    saveVideos(videos);
  }
}
