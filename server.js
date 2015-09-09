
/* app settings */
var BASE_URL = 'http://vchat.nullcannull-dev.net/';
var express = require('express');
var app = express();
var fs = require('fs');
var cookieParser = require('cookie-parser');
var session = require('express-session'), RedisStore = require('connect-redis')(session);
var connect = require('connect');
var credentials = require('credentials');
var bodyParser = require('body-parser');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
	store: new RedisStore({
		host: 'localhost', port: 6379, db: 9, ttl: 3600, secret: credentials.redisSecret
	}), 
	secret: credentials.sessionSecret,
	key: credentials.sessionKey,
	resave: true,
	saveUninitialized: true
}));
var server = app.listen(20000, () => {
	console.log('Server started on port %d', server.address().port);
});


/* database and redis initiate */
var pool = require('./models/db_pool');


/* libs */
app.get('/libs/:file', (req, res) => {
	var path = 'libs/' + req.params.file;
	
	fs.exists(path, (exists) => {
		if (exists) {
			res.sendFile(path, {root: './'});
		} else {
			res.send('File not found');
		}
	});
});

/* assets */
app.get('/assets/:type/:file', (req, res) => {
	var path = 'assets/' + req.params.type + '/' + req.params.file;
	
	fs.exists(path, (exists) => {
		if (exists) {
			res.sendFile(path, {root: './'});
		} else {
			res.send('File not found');
		}
	});
});

/* frontend */
app.get('/frontend/:type/:file', (req, res) => {
    var path = 'frontend/' + req.params.type + '/' + req.params.file;

    fs.exists(path, (exists) => {
        if (exists) {
            res.sendFile(path, {root: './'});
        } else {
            res.send('File not found');
        }
    });
});


/* static pages */
app.use('/', require('./api/main'));
app.use('/vChat/:room', require('./api/vchat'));

/* api routing */
app.use('/api/room', require('./api/room'));
app.use('/api/category', require('./api/category'));



