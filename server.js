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

app.get('/rss', function (req, res) {
  flatten({ minSize: 100000000 })
    .then(function(result) {
      var view = __dirname + '/views/html.jade';
      var locals = {}
      locals.files = result
      res.render(view, locals);
    })
})

app.listen(3000)
