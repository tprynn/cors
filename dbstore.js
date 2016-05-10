
var lockfile = require('lockfile');
var sqlite3 = require('sqlite3');

var db = new sqlite3.Database('db.sqlite', sqlite3.OPEN_READWRITE, function(error) {
	if(error) {
		console.log(error);
		process.exit(1);
	}
});

exports.new = function(uuid, object) {
	db.run("INSERT INTO data (uuid, json) VALUES ($uuid, $json)", {
		$uuid: uuid,
		$json: object
	});
}

exports.replace = function(uuid, replace_fn) {
	lockfile.lock('store/' + uuid + '.lock', {wait:500, retries:3, retryWait:250}, function(err) {
		if(err) {
			console.log('could not acquire lock!')
			console.log(err)
			//console.log(result)
			return
		}

		db.get("SELECT json FROM data WHERE uuid == $uuid", {
			$uuid: uuid
		}, function(err, row) {
			if(err) {
				console.log(error);
				lockfile.unlock('store/' + uuid + '.lock', function(err) {
					if(err) console.log(err)
				});
				return;
			}

			object = JSON.parse(row.json);
			json = JSON.stringify(replace_fn(object));

			db.run("UPDATE data SET json = $json WHERE uuid == $uuid", {
				$json: json,
				$uuid: uuid
			}, function(err) {
				lockfile.unlock('store/' + uuid + '.lock', function(err) {
					if(err) console.log(err)
				})
			});
		});
	});
}

exports.test = function(uuid, test_index, result) {
	exports.replace(uuid, function(object) {
		object.testcases[test_index] = result
		return object
	});
}

exports.complex = function(uuid, test_index, request_index, result) {
	exports.replace(uuid, function(object) {
		if(!object.complexcases[test_index]) {
			object.complexcases[test_index] = []
		}
		object.complexcases[test_index][request_index] = result
		return object
	});
}

exports.results = function(uuid, results) {
	exports.replace(uuid, function(object) {
		object.results = results
		return object
	});
}
