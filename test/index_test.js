const _ = require('lodash');
const Fs = require('fs');
const Moment = require('moment');
const Nock = require('nock');
const parse = require('parse-rss');
const Querystring = require('querystring');
const server = require('../server');

function parseRss(url) {
  return new Promise((resolve, reject) =>
    parse(url, (err, rss) => {
      if (err) return reject(err);
      return resolve(rss);
    })
  );
}

const isFile = (obj) => obj.content_type !== 'application/x-directory';
const getLink = (url, token) => fileId =>
  `${url}/v2/files/${fileId}/download?oauth_token=${token}`;
const linkRegex = /^https:\/\/api.put.io\/v2\/files\/([0-9]{9})\/download\?oauth_token=[A-Z|0-9]{8}$/;

const TOKEN = 'ABCD1234';
const LOCALHOST = 'http://localhost:3000';

const URL = 'https://api.put.io';
const PATH = '/v2/files/list';

const MOCK_PATH = `${__dirname}/mocks/`;

describe('test', () => {
  let apiContents = [];
  let apiFiles = [];

  // read json files and setup apiContents / apiFiles
  before(() => {
    const files = Fs.readdirSync(MOCK_PATH);

    files.forEach(filename => {
      const contents = Fs.readFileSync(MOCK_PATH + filename, 'utf-8');
      const json = JSON.parse(contents);
      apiContents = apiContents.concat(json.files);
    });
    apiFiles = apiContents.filter(isFile);
  });

  // setup Nock mock API server
  before(() => {
    const nock = Nock(URL);
    const files = Fs.readdirSync(MOCK_PATH);

    files.forEach((filename) => {
      const json = Fs.readFileSync(MOCK_PATH + filename);
      const parentId = filename.split('.')[0];

      const queryStr = { parent_id: parentId, oauth_token: TOKEN };
      //console.log(FULL_URL + '?oauth_token=' + TOKEN + '&parent_id=' + parentId);

      nock
      .get(PATH)
      .query(queryStr)
      // TODO - is there a way to make this unlimited?
      .times(100)
      .reply(200, json);
    });
  });

  // setup node-putcast
  // TODO - this should use a function to start the server
  before(() => server(3000));

  describe('server', () => {
    describe('rss feed', () => {
      it('must return the expected number of files', () => {
        const RSS_URL = `${LOCALHOST}/rss/${TOKEN}`;

        return parseRss(RSS_URL)
        .then(rss => {
          rss.length.must.eql(apiFiles.length);
        });
      });

      it('must return the expected files', () => {
        const expected = _.pluck(apiFiles, 'name').sort();

        const RSS_URL = `${LOCALHOST}/rss/${TOKEN}`;
        return parseRss(RSS_URL)
        .then(rss => {
          const titles = _.pluck(rss, 'title').sort();
          titles.must.eql(expected);
        });
      });

      it('must return the download links', () => {
        const apiFileLinks = _.pluck(apiFiles, 'id').map(getLink(URL, TOKEN));
        const expected = apiFileLinks.sort();

        const RSS_URL = `${LOCALHOST}/rss/${TOKEN}`;
        return parseRss(RSS_URL)
        .then(rss => {
          const links = _.pluck(rss, 'link').sort();
          links.must.eql(expected);
        });
      });

      it('must filter files below the minimum size', () => {
        const minSize = 100000;
        const filtered = apiFiles.filter(file => file.size > minSize);
        const expected = _.pluck(filtered, 'id').sort();

        const queryStr = Querystring.stringify({ minSize });
        const RSS_URL = `${LOCALHOST}/rss/${TOKEN}?${queryStr}`;
        return parseRss(RSS_URL)
        .then(rss => {
          const ids = rss.map(file => file.link.match(linkRegex)[1]);
          const idNumbers = ids.map(Number).sort();
          idNumbers.must.eql(expected);
        });
      });

      it('must filter files created before the specified date', () => {
        const createdAfter = '2016-04-30T00:00:00';
        const filtered = apiFiles.filter(file =>
          Moment(file.created_at).isAfter(Moment(createdAfter))
        );
        const expected = _.pluck(filtered, 'id').sort();

        const queryStr = Querystring.stringify({ createdAfter });
        const RSS_URL = `${LOCALHOST}/rss/${TOKEN}?${queryStr}`;
        return parseRss(RSS_URL)
        .then(rss => {
          const ids = rss.map(file => file.link.match(linkRegex)[1]);
          const idNumbers = ids.map(Number).sort();
          idNumbers.must.eql(expected);
        });
      });

      it.skip('must return appropriate errors', () => {
      });
    });
  });
});
