var Q = require('q');
var moment = require('moment');
var _ = require('lodash');
var request = require('request')

var URL = 'https://api.put.io/v2/files';
var LIST_URL = URL + '/list';

var flattenFiles = function(token) {
  var fileList = [];
 
  var loopFetchContents = function(token, folders) {
    return fetchFoldersContents(token, folders)
      .spread(function(folders, files) {
        //console.log('folders to search', folders)
        fileList = fileList.concat(files);
        if (folders.length) {
          var folderIds = folders.map(function(folder) { return folder.id; });
          return loopFetchContents(token, folderIds);
        } else {
          //console.log('fileList', fileList)
          return fileList;
        }
      });
  };

  return loopFetchContents(token, [0])
}

//fetch the contents of an array of folder ids
var fetchFoldersContents = function(token, folders) {
  var defer = Q.defer();
  console.log('fetching files for folders', folders);

  //fetch files for each folder
  Q.all(folders.map(function(folder) {
    return fetchFolderContents(token, folder);
  }))
  //flatten the result of Q.all into single array
  .then(Q.fbind(_.flatten))
  .then(splitResults.bind(this, defer));

  return defer.promise;
};


//fetch the contents of a single folder id
var fetchFolderContents = function(token, folder) {
  console.log('fetching files for folder', folder);
  var defer = Q.defer();
  var query = {
    oauth_token: token,
    parent_id: folder
  }
  request.get({url: LIST_URL, qs: query, json: true}, function (error, response, body) {
    if (error) return defer.reject(error);
    return defer.resolve(body.files);
  });
  return defer.promise;
};


//split the result of a contents search into files and folders
var splitResults = function(defer, results) {
  var files = [], folders = [];
  
  //split files and folders into separate arrays
  for (i = 0; i < results.length; i++) {
    var item = results[i];
    if (item.content_type === 'application/x-directory') folders.push(item);
    else files.push(item);
  }

  //console.log('files', files)
  //console.log('folders', folders)

  defer.resolve([folders, files]);
};

var filterFiles = function(opts, files) {
  //console.log('files', files)
  if (!opts) opts = {};
  //console.log('files before filter',files)
  var filtered = files.filter(function(file) {
    //exclude folders
    if (file.content_type === 'application/x-directory') return false;
    //exclude files below a specified file size
    if (opts.minSize && file.size < opts.minSize) return false;
    //exclude files created before
    if (opts.createdAfter) {
      var createdAt = moment(file.created_at);
      if (createdAt.isBefore(opts.createdAfter)) return false;
    }
    return true;
  });
  //console.log('files remaining after filter', filtered.length);
  return filtered;
};

var appendDownloadLink = function(token, files) {
  return files.map(function(file) { 
    file.download = URL + 'files/' + file.id + '/download?oauth_token=' + token;
    return file;
  });
};

module.exports = function(token, opts) {
  return flattenFiles(token)
    .then(filterFiles.bind(this, opts))
    .then(appendDownloadLink.bind(this, token))
    .catch(function(err) { console.error(err) })
};
