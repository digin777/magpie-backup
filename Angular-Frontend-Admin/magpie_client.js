const express = require('express');
var compression = require('compression');
var expressStaticGzip = require('express-static-gzip');
var CONFIG = require('./config/web-config');
const port = process.env.PORT || CONFIG.app.PORT;
const app = express();
app.use(compression());

// app.use(express.static(path.join(__dirname, 'dist')));
app.use('/', expressStaticGzip(__dirname+'/'+CONFIG.app.BUILD_PATH, {
  enableBrotli: true, 
  orderPreference: ['br','gzip','deflate']
}));

app.use('/', express.static(__dirname  + '/'+CONFIG.app.BUILD_PATH+'/'));

app.use('*', function (req, res, next) {
	// Just send the index.html for other files to support HTML5Mode
	res.sendFile('index.html', {root: __dirname + '/'+ CONFIG.app.BUILD_PATH+'/'});
});

app.listen(port);
console.log('current directory is', __dirname);
console.log('server start on port ' + port);