var router = require('express').Router();
var request = require('request');
var apiKey = require('credentials').youtubeAPIKey;

router.get('/', (req, res) => {
  var data = {
    url: 'https://www.googleapis.com/youtube/v3/search',
    qs: {
      key: apiKey,
      part: 'snippet',
      q: req.query.q,
      type: 'video',
      maxResults: 20
    },
    headers: {
      'Referer': 'vchat.nullcannull-dev.net'
    }
  };

  if (typeof req.query.pageToken !== 'undefined') data['qs']['pageToken'] = req.query.pageToken;

  request.get(data, (error, response, body) => {
    res.send(body);
  });
});

module.exports = router;
