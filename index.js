var express = require('express');
var app = express();

var flatten = require('./lib/flatten.js');

app.get('/html/:token', function (req, res) {
  var token = req.params.token;
  if (!token) throw new Error("oauth token not provided");
  var opts = req.query;
  //TODO - write function to sanitize query opts
  if (opts.minSize) opts.minSize = parseInt(opts.minSize);
  flatten(token, opts)
    .then(function(result) {
      //console.log('result', result)
      var view = __dirname + '/views/html.jade';
      var locals = {};
      locals.files = result;
      res.render(view, locals);
    });
});

app.get('/rss/:token', function (req, res) {
  var token = req.params.token;
  if (!token) throw new Error("oauth token not provided");
  var opts = req.query;
  //TODO - write function to sanitize query opts
  if (opts.minSize) opts.minSize = parseInt(opts.minSize);
  flatten(token, opts)
    .then(function(result) {
      //console.log('result', result)
      var view = __dirname + '/views/rss.jade';
      var locals = {};
      locals.feedUrl = getFullUrl(req);
      locals.files = result;
      res.render(view, locals);
    });
});

//start server
var port = process.env.PORT || 3000;
app.listen(port);
console.log("Server started on port " + port);

var getFullUrl = function(req) { 
  return req.protocol + '://' + req.get('host') + req.originalUrl;
};
