const express = require('express');
const app = express();

const flatten = require('./lib/flatten.js');

function getFullUrl(req) {
  return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
}

app.get('/html/:token', (req, res) => {
  const token = req.params.token;
  if (!token) throw new Error('oauth token not provided');
  const opts = req.query;
  //TODO - write function to sanitize query opts
  if (opts.minSize) opts.minSize = parseInt(opts.minSize);
  flatten(token, opts)
  .then((result) => {
    //console.log('result', result)
    const view = `${__dirname}/views/html.jade`;
    const locals = {};
    locals.files = result;
    res.render(view, locals);
  });
});

app.get('/rss/:token', (req, res) => {
  const token = req.params.token;
  if (!token) throw new Error('oauth token not provided');
  const opts = req.query;
  //TODO - write function to sanitize query opts
  if (opts.minSize) opts.minSize = parseInt(opts.minSize);
  flatten(token, opts)
  .then((result) => {
    //console.log('result', result)
    const view = `${__dirname}/views/rss.jade`;
    const locals = {};
    locals.feedUrl = getFullUrl(req);
    locals.files = result;
    res.render(view, locals);
  });
});

//start server
const port = process.env.PORT || 3000;
app.listen(port);
console.log(`Server started on port ${port}`);
