const Q = require('q');
const moment = require('moment');
const _ = require('lodash');
const request = require('request');

const URL = 'https://api.put.io/v2/files';
const LIST_URL = `${URL}/list`;

//split the result of a contents search into files and folders
function splitResults(defer, results) {
  let i;
  const files = [];
  const folders = [];

  //split files and folders into separate arrays
  for (i = 0; i < results.length; i++) {
    const item = results[i];
    if (item.content_type === 'application/x-directory') folders.push(item);
    else files.push(item);
  }

  //console.log('files', files)
  //console.log('folders', folders)

  defer.resolve([folders, files]);
}

//fetch the contents of a single folder id
function fetchFolderContents(token, folder) {
  console.log('fetching files for folder', folder);
  const defer = Q.defer();
  const query = {
    oauth_token: token,
    parent_id: folder
  };
  request.get({ url: LIST_URL, qs: query, json: true }, (error, response, body) => {
    if (error) return defer.reject(error);
    return defer.resolve(body.files);
  });
  return defer.promise;
}

//fetch the contents of an array of folder ids
function fetchFoldersContents(token, folders) {
  const defer = Q.defer();
  console.log('fetching files for folders', folders);

  //fetch files for each folder
  Q.all(folders.map(folder => fetchFolderContents(token, folder)))

  //flatten the result of Q.all into single array
  .then(Q.fbind(_.flatten))
  .then(splitResults.bind(this, defer));

  return defer.promise;
}

function flattenFiles(apiToken) {
  let fileList = [];

  function loopFetchContents(token, foldersArr) {
    return fetchFoldersContents(token, foldersArr)
    .spread((folders, files) => {
      //console.log('folders to search', folders)
      fileList = fileList.concat(files);

      if (folders.length) {
        const folderIds = folders.map((folder) => folder.id);
        return loopFetchContents(token, folderIds);
      }

      return fileList;
    });
  }

  // [0] start with the root folder
  return loopFetchContents(apiToken, [0]);
}

function filterFiles(opts = {}, files) {
  //console.log('files', files)
  //console.log('files before filter',files)
  const filtered = files.filter(file => {
    //exclude folders
    if (file.content_type === 'application/x-directory') return false;
    //exclude files below a specified file size
    if (opts.minSize && file.size < opts.minSize) return false;
    //exclude files created before
    if (opts.createdAfter) {
      const createdAt = moment(file.created_at);
      if (createdAt.isBefore(opts.createdAfter)) return false;
    }
    return true;
  });
  //console.log('files remaining after filter', filtered.length);
  return filtered;
}

function appendDownloadLink(token, files) {
  return files.map(file => {
    file.download = `${URL}/${file.id}/download?oauth_token=${token}`;
    return file;
  });
}

module.exports = function exports(token, opts) {
  return flattenFiles(token)
    .then(filterFiles.bind(this, opts))
    .then(appendDownloadLink.bind(this, token))
    .catch((err) => { console.error(err); });
};
