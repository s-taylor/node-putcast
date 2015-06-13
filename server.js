var express = require('express')
var app = express()

var flatten = require('./lib/flatten.js')

app.get('/', function (req, res) {
  flatten({ minSize: 100000000 })
    .then(function(result) {
      //console.log('result', result)
      var view = __dirname + '/views/index.jade';
      var locals = {
        files: result
      }
      res.render(view, locals);
    })
})

app.listen(3000)
