
var fsStore = require('json-fs-store')()
var lockfile = require('lockfile')

exports.new = function(uuid, object) {
	lockfile.lock('store/' + uuid + '.lock', {wait:500, retries:3, retryWait:250}, function(err) {
		if(err) {
			console.log('could not acquire lock!')
			console.log(err)
			//console.log(result)
			return
		}

		object.id = uuid
		fsStore.add(object, function(err) {
			if(err) console.log(err)
			lockfile.unlock('store/' + uuid + '.lock', function(err) {
				if(err) console.log(err)
			})
		})
	})
}

exports.replace = function(uuid, replace_fn) {
	lockfile.lock('store/' + uuid + '.lock', {wait:500, retries:3, retryWait:250}, function(err) {
		if(err) {
			console.log('could not acquire lock!')
			console.log(err)
			//console.log(result)
			return
		}

		fsStore.load(uuid, function(err, object) {
			if(err) {
				lockfile.unlock('store/' + uuid + '.lock', function(err) {
					if(err) console.log(err)
				})
				console.log(err)
				return
			}

			object = replace_fn(object)

			fsStore.add(object, function(err) {
				if(err) console.log(err)
				lockfile.unlock('store/' + uuid + '.lock', function(err) {
					if(err) console.log(err)
				})
			})
		})
	})
}

exports.test = function(uuid, test_index, result) {
	exports.replace(uuid, function(object) {
		object.testcases[test_index] = result
		return object
	})
}

exports.complex = function(uuid, test_index, request_index, result) {
	exports.replace(uuid, function(object) {
		if(!object.complexcases[test_index]) {
			object.complexcases[test_index] = []
		}
		object.complexcases[test_index][request_index] = result
		return object
	})
}

exports.results = function(uuid, results) {
	exports.replace(uuid, function(object) {
		object.results = results
		return object
	})
}
