var express = require('express')
var app = express()

var flatten = require('./lib/flatten.js')

app.get('/html/:token', function (req, res) {
  var token = req.params.token;
  if (!token) throw new Error("oauth token not provided");
  flatten(token, { minSize: 100000000 })
    .then(function(result) {
      //console.log('result', result)
      var view = __dirname + '/views/html.jade';
      var locals = {}
      locals.files = result
      res.render(view, locals);
    })
})

app.get('/rss/:token', function (req, res) {
  var token = req.params.token;
  if (!token) throw new Error("oauth token not provided");
  flatten(token, { minSize: 100000000 })
    .then(function(result) {
      //console.log('result', result)
      var view = __dirname + '/views/rss.jade';
      var locals = {}
      locals.feedUrl = getFullUrl(req);
      locals.files = result
      res.render(view, locals);
    })
})

app.listen(3000)

var getFullUrl = function(req) { 
  return req.protocol + '://' + req.get('host') + req.originalUrl;
}
