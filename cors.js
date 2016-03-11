
var express = require('express')

var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var useragent = require('useragent')
var uuid = require('node-uuid')

var store = require('./store.js')
var testcases = require('./testcases.js')

var app = express()

app.set('etag', false); 
app.set('x-powered-by', false);

app.use(cookieParser())
app.use(bodyParser.text({type:"*/*"}))

app.get('/', function(req, res) {
	if(req.hostname === 'cors.tannerprynn.com')
		res.redirect('http://sub.cors.tannerprynn.com')
	res.sendFile('cors.html', {root: __dirname})
})

app.get('/:file(cors.html|testcases.js|testsuite.js)', function(req, res) {
	res.sendFile(req.params.file, {root: __dirname})
})

app.get('/status', function(req, res) {
	console.log('hit /status')
	res.set({'Access-Control-Expose-Headers': '*'})
	res.send("OK")
})

app.get('/id/new', function(req, res) {
	var id = uuid.v4()

	store.new(id, {
		useragent: req.headers['user-agent'],
		browser: useragent.parse(req.headers['user-agent']).toString(),
		testcases: [],
		complexcases: []
	}, function(err) {
		if(err) console.log(err)
	})

	res.cookie('uuid', id)
	res.setHeader('Access-Control-Allow-Origin', 
					req.get('Origin') ? req.get('Origin') : '*')
	res.setHeader('Access-Control-Allow-Credentials', 'true')
	res.send(id)
})

app.all('/:type(simple|complex)/:index/:request?', function(req, res) {
	if(!uuid.validate(req.query.uuid)) {
		res.sendStatus(400)
		res.end()
		return
	}

	var testcase = null
	if(req.params.type === "simple") {
		var testcase = testcases.cases[req.params.index]
	}
	else {
		var testcase = testcases.complex_cases[req.params.index][req.params.request]
	}

	if(!testcase) {
		res.sendStatus(400)
		res.end()
		return
	}

	console.log(req.method + ' ' + req.url)

	if(req.method === testcase.server_ignore_method) {
		console.log('ignoring ' + req.method + ' for testcase ' + req.params.index +
				(req.params.type === "complex" ? '.' + req.params.request : ''))
		// Set the response headers for this test case
		for (var i = 0; i < testcase.returned_headers.length; i++) {
			var header = testcase.returned_headers[i]
			res.setHeader(header[0], header[1])
		}
		res.sendStatus(200)
		res.end()
		return
	}

	console.log('running testcase ' + req.params.index +
				(req.params.type === "complex" ? '.' + req.params.request : ''))

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
	if(req.params.type === "simple") {
		store.test(req.query.uuid, req.params.index, result)
	}
	else {
		console.log(req.query.uuid)
		store.complex(req.query.uuid, req.params.index, req.params.request, result)
	}

	var output = JSON.stringify(result, null, 2)
	//console.log(output)
	res.send(output)
})

app.options('/results', function(req, res) {
	res.setHeader("Access-Control-Allow-Origin", req.origin)
	res.setHeader("Access-Control-Allow-Methods", req.method)
	res.setHeader("Access-Control-Allow-Credentials", "true")
	res.setHeader("Access-Control-Allow-Headers", "Content-Type")
	res.sendStatus(200)
})

app.post('/results', function(req, res) {
	console.log("Got results from " + req.query.uuid)
	//console.log(req.query.uuid)
	//console.log(req.body)
	if(!uuid.validate(req.query.uuid)) {
		res.sendStatus(400)
		res.end()
		return
	}

	try {
		results = JSON.parse(req.body)
		store.results(req.query.uuid, results)
		res.sendStatus(200)
		res.end()
		return
	}
	catch(e) {
		console.log("Failed to store results: " + e.toString())
	}

	res.sendStatus(500)
})

app.listen(3000, function() {
	console.log("Started listening on port 3000")
})

uuid.validate = function(id) {
	if(!(id && id.match)) {
		return false
	}

	return id.match(/^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$/) != null
}


