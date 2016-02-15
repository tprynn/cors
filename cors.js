
var express = require('express')

var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var useragent = require('useragent')
var uuid = require('node-uuid')
var store = require('json-fs-store')()
var lockfile = require('lockfile')

var testcases = require('./testcases.js')

var app = express()

app.set('etag', false); 
app.set('x-powered-by', false);

app.use(cookieParser())
app.use(bodyParser.text({type:"*/*"}))

app.get('/status', function(req, res) {
	console.log('hit /status')
	res.set({'Access-Control-Expose-Headers': '*'})
	res.send("OK")
})

app.get('/id/new', function(req, res) {
	var id = uuid.v4()

	store.add({
		id: id, 
		useragent: req.headers['user-agent'],
		browser: useragent.parse(req.headers['user-agent']).toString(),
		testcases: []
	}, function(err) {
		if(err) console.log(err)
	})

	res.cookie('uuid', id)
	res.setHeader('Access-Control-Allow-Origin', 
					req.get('Origin') ? req.get('Origin') : '*')
	res.setHeader('Access-Control-Allow-Credentials', 'true')
	res.send(id)
})

app.all('/testcase/:index', function(req, res) {
	if(!uuid.validate(req.query.uuid)) {
		res.sendStatus(400)
		res.end()
		return
	}

	var testcase = testcases.cases[req.params.index]

	if(!testcase) {
		res.sendStatus(400)
		res.end()
		return
	}

	console.log(req.method + ' ' + req.url)
	console.log('running testcase ' + req.params.index)

	// Check our expectations against the user's query
	var expectations = []
	for (var i = 0; i < testcase.expectations.length; i++) {
		var expectation = testcase.expectations[i]
		var result = expectation.expect(req)
		console.log('\t' + expectation.description + ': ' + result)
		expectations.push({
			description: expectation.description,
			result: result
		})
	}

	// Set the response headers for this test case
	for (var i = 0; i < testcase.returned_headers.length; i++) {
		var header = testcase.returned_headers[i]
		res.setHeader(header[0], header[1])
	}

	res.setHeader("Content-Type", "application/json")
	res.setHeader("Connection", "close")

	var result = {
		"method": req.method,
		"host": req.hostname,
		"uri": req.url,
		"headers": req.headers,
		"content": req.body,
		"expectations": expectations
	}

	// Store this crap in case we want to see it later
	store_test_result(req.query.uuid, req.params.index, result)

	var output = JSON.stringify(result, null, 2)
	//console.log(output)
	res.send(output)
})

app.listen(3000, function() {
	console.log("Started listening on port 3000")
})

uuid.validate = function(id) {
	return id.match(/^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$/) != null
}

store_test_result = function(uuid, test_index, result) {
	lockfile.lock('store/' + uuid + '.lock', {wait:500, retries:3, retryWait:250}, function(err) {
		if(err) {
			console.log('could not acquire lock!')
			console.log(err)
			console.log(result)
			return
		}

		store.load(uuid, function(err, object) {
			if(err) {
				lockfile.unlock('store/' + uuid + '.lock', function(err) {
					if(err) console.log(err)
				})
				console.log(err)
				return
			}

			object.testcases[test_index] = result

			store.add(object, function(err) {
				if(err) console.log(err)
				lockfile.unlock('store/' + uuid + '.lock', function(err) {
					if(err) console.log(err)
				})
			})
		})
	})
}
