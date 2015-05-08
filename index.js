var Q = require('q');
var PutIO = require('put.io-v2');

var api = new PutIO("");

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
		//.done(function() { console.log('files', files) })
}

var fetchFiles = function(api, page) {
	var defer = Q.defer();
	console.log('fetching files for page', page);
	api.files.search('from: "all"', page, function(result) {
		console.log(result.files.length + '', 'files found on page', page + '');
		defer.resolve(result);
	});
	return defer.promise;
}

var filterFiles = function(files) {
	console.log('im here!')
	return files.filter(function(file) {
		if (file.content_type === 'application/x-directory') return false;
		return true;
	});
}

flattenFiles(api)
	//.then(filterFiles)
	.done(function(files) { console.log(files) });
