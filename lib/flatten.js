var Q = require('q');
var moment = require('moment');
var _ = require('lodash');
var PutIO = require('put.io-v2');

var flattenFiles = function(api) {
  var fileList = [];
 
  var loopFetchContents = function(api, folders) {
    return fetchContents(api, folders)
      .spread(function(folders, files) {
        //console.log('folders to search', folders)
        fileList = fileList.concat(files);
        if (folders.length) {
            var folderIds = folders.map(function(folder) { return folder.id; })
            return loopFetchContents(api, folderIds)
        } else {
          //console.log('fileList', fileList)
          return fileList;
        }
      })
  }

  return loopFetchContents(api, [0])
}

//fetch the files from a specified page
var fetchContents = function(api, folders) {
  var defer = Q.defer();
  console.log('fetching files for folders', folders);

  //fetch files for each folder
  Q.all(folders.map(function(folder) {
    return fetchFiles(api, folder);
  }))
  .then(function(results) {
    var files = [];
    var folders = [];

    var results = _.flatten(results);
    //console.log('results of Q.all', results)
    
    //split files and folders into separate arrays
    for (i = 0; i < results.length; i++) {
      var item = results[i];
      if (item.content_type === 'application/x-directory') folders.push(item)
      else files.push(item)
    }

    //console.log('files', files)
    //console.log('folders', folders)

    defer.resolve([folders, files]);
  });
  return defer.promise;
}

var fetchFiles = function(api, folder) {
  console.log('fetching files for folder', folder);
  var defer = Q.defer();
  try {
    api.files.list(folder, function(result) {
      //console.log('result of fetchFiles', result)
      defer.resolve(result.files);
    })
  } catch (e) {
    defer.reject(e);
  }
  return defer.promise;
}

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
      var createdAt = moment(file.created_at)
      if (createdAt.isBefore(opts.createdAfter)) return false;
    }
    return true;
  })
  //console.log('files remaining after filter', filtered.length);
  return filtered;
}

var appendDownloadLink = function(api, files) {
  return files.map(function(file) { 
    file.download = api.files.download(file.id);
    return file;
  })
}

module.exports = getFiles = function(token, opts) {
  var api = new PutIO(token);
  return flattenFiles(api)
    .then(filterFiles.bind(this, opts))
    .then(appendDownloadLink.bind(this, api))
    .catch(function(err) { console.error(err) })
};
