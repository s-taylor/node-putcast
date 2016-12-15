const express = require('express');
const flatten = require('./lib/flatten');

function getFullUrl(req) {
  return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
}

module.exports = function server(port) {
  const app = express();

  app.get('/html/:token', (req, res) => {
    const token = req.params.token;
    if (!token) throw new Error('oauth token not provided');
    const opts = req.query;
    //TODO - write function to sanitize query opts
    if (opts.minSize) opts.minSize = Number(opts.minSize);
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
    if (opts.minSize) opts.minSize = Number(opts.minSize);
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
  app.listen(port);
  console.log(`Server started on port ${port}`);
};
