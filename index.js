var Q = require('q');
var moment = require('moment');
var PutIO = require('put.io-v2');

var token = process.env.token;
var api = new PutIO(token);

var flattenFiles = function(api) {
	var page = 1;
	var files = [];

	return fetchFiles(api, page)
		.then(function(result) {
			//append the files to the files array
			files = files.concat(result.files);
			//if there are more files, fetch these!
			if (result.next !== '') return fetchFiles(api, ++page);
			return files;
		})
}

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

var filterFiles = function(minSize, createdAfter, files) {
	//console.log('files before filter',files)
	return files.filter(function(file) {
		//exclude folders
		if (file.content_type === 'application/x-directory') return false;
		//exclude files below a specified file size
		if (minSize && file.size < minSize) return false;
		//exclude files created before
		if (createdAfter) {
			var createdAt = moment(file.created_at)
			if (createdAt.isBefore(createdAfter)) return false;
		}
		return true;
	})
}

var getDownloadLinks = function(files) {
  console.log('files')
  return files.map(function(file) { return api.files.download(file.id) })
}

flattenFiles(api)
	.then(filterFiles.bind(this, 100000, false))
	.then(getDownloadLinks)
	.done(function(results) {
    //console.log('download links', results)
		var prettyPrint = results.join('\n');
		console.log(prettyPrint)
	});
