var Q = require('q');
var moment = require('moment');
var PutIO = require('put.io-v2');

var token = process.env.token;
var api = new PutIO(token);

var flattenFiles = function(api) {
	var page = 1;
	var files = [];

  //recursively call fetch files for each page
  //until no next page can be found (result.next)
  var loopFetchFiles = function(api, page) {
    return fetchFiles(api, page)
      .then(function(result) {
        //append the files to the files array
        files = files.concat(result.files);
        //if there are more files, fetch these!
        if (result.next !== '') return loopFetchFiles(api, ++page);
        return files;
      })
  }

  return loopFetchFiles(api, page);
}

//fetch the files from a specified page
var fetchFiles = function(api, page) {
	var defer = Q.defer();
	console.log('fetching files for page', page);
	api.files.search('from: "all"', page, function(result) {
		console.log(result.files.length + '', 'files found on page', page + '');
		//console.log('result from fetchFiles', result)
		defer.resolve(result);
	});
	return defer.promise;
}

var filterFiles = function(opts, files) {
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
	console.log('files remaining after filter', filtered.length);
	return filtered;
}

var getDownloadLinks = function(files) {
  return files.map(function(file) { return api.files.download(file.id) })
}

flattenFiles(api)
	.then(filterFiles.bind(this, { minSize: 10000 }))
	.then(getDownloadLinks)
	.done(function(results) {
    //console.log('download links', results)
		var prettyPrint = results.join('\n');
		console.log(prettyPrint)
	});
