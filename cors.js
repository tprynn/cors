
var express = require('express')
var bodyParser = require('body-parser')
var useragent = require('useragent')
var uuid = require('node-uuid')
var sqlite3 = require('sqlite3')
var store = require('json-fs-store')()

var testcases = require('./testcases.js')

var app = express()

app.set('etag', false); 
app.set('x-powered-by', false);

app.use(bodyParser.text({type:"*/*"}))

app.get('/status', function(req, res) {
	console.log('hit /status')
	res.send("OK")
})

app.get('/id/new', function(req, res) {
	var id = uuid.v4()
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.send(id)
	store.add({
		id: id, 
		useragent: req.headers['user-agent'],
		browser: useragent.parse(req.headers['user-agent']).toString(),
		testcases: []
	}, function(err) {
		console.log(err)
	})
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

	// Check our expectations against the user's query
	var expectations = []
	for (var i = 0; i < testcase.expectations.length; i++) {
		var expectation = testcase.expectations[i]
		var result = expectation.expect(req)
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

	var output = JSON.stringify({
		"method": req.method,
		"host": req.hostname,
		"uri": req.url,
		"headers": req.headers,
		"content": req.body,
		"expectations": expectations
	}, null, 2)

	// Store this crap in case we want to see it later
	store.load(req.query.uuid, function(err, object) {
		if(err) {
			console.log(err)
			return
		}

		object.testcases[req.params.index] = output
		store.add(object, function(err) {
			console.log(err)
		})
	})

	console.log(output)
	res.send(output)
})

app.listen(3000, function() {
	console.log("Started listening on port 3000")
})

uuid.validate = function(id) {
	return id.match(/^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$/) != null
}
