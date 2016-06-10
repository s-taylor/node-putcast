var _ = require("lodash");
var Fs = require('fs');
var Nock = require("nock");
var parse = require("parse-rss");

var parseRss = function(url) {
  return new Promise(function(resolve, reject) {
    return parse(url, function(err, rss) {
      if (err) return reject(err);
      return resolve(rss);
    });
  });
}

var isFile = (obj) => obj['content_type'] !== "application/x-directory";

var TOKEN = 'ABCD1234';
var LOCALHOST = 'http://localhost:3000';

var URL = 'https://api.put.io';
var PATH = '/v2/files/list';
var FULL_URL = URL + PATH;

var MOCK_PATH = __dirname + '/mocks/';

describe("test", function() {
  let apiContents = [];
  let apiFiles = [];

  before(function() {
    var files = Fs.readdirSync(MOCK_PATH);

    files.forEach(function(filename) {
      var contents = Fs.readFileSync(MOCK_PATH + filename, 'utf-8');
      var json = JSON.parse(contents);
      apiContents = apiContents.concat(json.files);
    });
    apiFiles = apiContents.filter(isFile);
  });

  // setup Nock mock API server
  before(function() {
    var nock = Nock(URL);
    var files = Fs.readdirSync(MOCK_PATH);

    files.forEach(function(filename) {
      var json = Fs.readFileSync(MOCK_PATH + filename);
      var parentId = filename.split('.')[0];

      var queryStr = {parent_id: parentId, oauth_token: TOKEN};
      //console.log(FULL_URL + "?oauth_token=" + TOKEN + "&parent_id=" + parentId);
      //TODO - can this just be permanent?
      nock.get(PATH).query(queryStr).times(100).reply(200, json);
    });
  });

  // setup node-putcast
  before(function() { require("../index"); });

  describe("server", function() {
    describe("rss feed", function() {
      it("must return the expected number of files", function() {
        var RSS_URL = LOCALHOST + '/rss/' + TOKEN;

        return parseRss(RSS_URL)
          .then(function(rss) {
            rss.length.must.eql(apiFiles.length);
          })
      });

      it("must return the expected files", function() {
        var expected = _.pluck(apiFiles, 'name').sort();

        var RSS_URL = LOCALHOST + '/rss/' + TOKEN;
        return parseRss(RSS_URL)
          .then(function(rss) {
            var titles = _.pluck(rss, "title").sort();
            titles.must.eql(expected);
          })
      })

      it("must return the download links", function() {
        var apiFileLinks = apiFiles.map(file => {
          return URL + '/v2/files/' + file.id + '/download?oauth_token=' + TOKEN;
        })
        var expected = apiFileLinks.sort();

        var RSS_URL = LOCALHOST + '/rss/' + TOKEN;
        return parseRss(RSS_URL)
          .then(function(rss) {
            var links = _.pluck(rss, "link").sort();
            links.must.eql(expected);
          })
      });
    });
  });
});
