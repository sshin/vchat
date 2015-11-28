var router = require('express').Router();
var request = require('request');
var credentials = require('credentials');

router.get('/', (req, res) => {
  var data = {
    url: 'https://www.googleapis.com/youtube/v3/search',
    qs: {
      key: credentials.youtubeAPIKey,
      part: 'snippet',
      q: req.query.q,
      type: 'video',
      maxResults: 20
    },
    headers: {
      'Referer': credentials.APIReferer
    }
  };

  if (typeof req.query.pageToken !== 'undefined') data['qs']['pageToken'] = req.query.pageToken;

  request.get(data, (error, response, body) => {
    res.send(body);
  });
});

module.exports = router;
