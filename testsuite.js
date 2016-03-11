
uuid = 'default-id'
requests = []

start = function() {
	log.status('trying our first cross-site request...')

	try {
		var xhr = new XMLHttpRequest()
		xhr.open('GET', server.url + 'id/new')
		xhr.withCredentials = true
		xhr.send()

		xhr.onreadystatechange = function() {
			if(xhr.readyState == XMLHttpRequest.DONE) {
				uuid = xhr.responseText
				run_tests()
			}
		}
	}
	catch(ex) {
		message = "Got an exception on our first request, your browser might not support CORS. (FAIL)"
		log.status(message)
		log.text(message)
	}
}

var queued_tests = []
var running_tests = []
var finished_tests = []

run_tests = function() {
	log.status('spinning up the test runner...')

	var n_parallel_requests = 3
	
	for (var test_index = 0; test_index < cases.length; test_index++) {
		queued_tests.push({
			type: "simple",
			index: test_index,
			testcase: cases[test_index]
		})
	}

	for (var test_index=0; test_index < complex_cases.length; test_index++) {
		queued_tests.push({
			type: "complex",
			index: test_index,
			testcase: complex_cases[test_index]
		})
	}

	// Create a lock for the test runner so that we don't have
	// two threads trying to write queued/running/finished tests
	var locked = false;
	var intervalId = setInterval(function() {
		// console.log('Queued: ' + queued_tests)
		// console.log('Running: ' + running_tests)
		// console.log('Finished: ' + finished_tests)
		if(locked) return;
		locked = true;

		log.status(finished_tests.length + ' finished_tests, ' +
				running_tests.length + ' running tests, ' +
				queued_tests.length + ' tests remaining')

		// if all tests are finished, end the test runner
		if(queued_tests.length === 0) {
			var finished = true
			for(var i = 0; i < n_parallel_requests; i++) {
				if(running_tests[i]) {
					finished = false
					break
				}
			}
			
			if(finished) {
				log.status('finished all the tests, reporting results...')
				clearInterval(intervalId)
				post_results(finished_tests)
			}
		}

		// check each running test to see if it's finished, and move to finished tests
		for(var i = 0; i < running_tests.length; i++) {
			var test = running_tests[i]

			if(!test) {
				continue
			}

			if(test.finished) {
				finished_tests.push(test)
				running_tests[i] = null
			}
		}

		// if < n_parallel running tests, pop tests from queue and start them
		if(queued_tests.length !== 0) {
			for(var i = 0; i < n_parallel_requests; i++) {
				if(!running_tests[i]) {
					var test_obj = null;
					while(!test_obj && queued_tests.length) {
						test_obj = queued_tests.shift()
					}
					if(test_obj) {
						running_tests[i] = run_testcase(test_obj)
					}
				}
			}
		}

		locked = false;
		return;
	}, 200)
}

run_testcase = function(test_obj) {
	// need to collect all the requests in the test object: 1 or many (simple/complex)
	var testcases = []

	if(test_obj.type === "complex") {
		for (var i = 0; i < test_obj.testcase.length; i++) {
			testcases.push(test_obj.testcase[i])
		}
	}
	else {
		testcases.push(test_obj.testcase)
	}

	var n_requests = testcases.length

	// Recursive test runner for testcases
	// Handles both single and complex (chained) requests
	var run_test_r = function(testcases) {
		if(!testcases.length) {
			test_obj.finished = true
			return
		}

		var requests_remaining = testcases.length
		var request_index = n_requests - requests_remaining

		var test = testcases.shift()
		test.request_index = request_index

		var xhr = new XMLHttpRequest()

		var params = 'uuid=' + encodeURIComponent(uuid)

		try {
			if(test_obj.type === "simple") {
				xhr.open(test.method, test.url + 'simple/' + test_obj.index + '?' + params)
			}
			else {
				xhr.open(test.method, test.url + 'complex/' + test_obj.index + '/' + request_index + '?' + params)
			}
		}
		catch(ex) {
			run_assertions(test_obj, test, xhr)
			log.text('\t' + ex.message)
			run_test_r(testcases)
			return
		}

		for (var i = 0; i < test.request_headers.length; i++) {
			var header = test.request_headers[i]
			xhr.setRequestHeader(header[0], header[1])
		}

		if(test.creds)
			xhr.withCredentials = test.creds

		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				run_assertions(test_obj, test, xhr)
				run_test_r(testcases)
			}
		}

		xhr.send(test.body)
	}

	run_test_r(testcases)
	return test_obj
}

run_assertions = function(test_obj, test, xhr) {
	if(test_obj.type === "simple" ) {
		log.context_simple(test_obj.index, test.context)
	}
	else {
		log.context_complex(test_obj.index, test.request_index, test.context)
	}

	var n_assertions = test.assertions.length
	for (var i = 0; i < n_assertions; i++) {
		var assertion = test.assertions[i]
		assertion.result = assertion.assert(xhr)
		log.assertion(assertion.description, assertion.result)
	}
}

post_results = function(xhrobjs) {
	var results = []
	for(var i = 0; i < xhrobjs.length; i++) {
		results[i] = xhrobjs[i].testcase
	}

	var xhr = new XMLHttpRequest()
	xhr.open("POST", server.url + 'results?uuid=' + uuid)

	xhr.onreadystatechange = function() {
		if (xhr.readyState == XMLHttpRequest.DONE) {
			log.status("we're all done here!")
		}
	}

	xhr.send(JSON.stringify(results, null, 4))
}

log = {
	text: function(message) {
		message = message.replace(/[<>&]/g, '')
		document.getElementById('log').innerHTML += message + '\n'
		console.log(message)
	},

	context_simple: function(index, context) {
		message = 'simple test ' + index + ': ' + context
		log.text(message)
	},

	context_complex: function(index, request, context) {
		message = 'complex test ' + index + '.' + request + ': ' + context
		log.text(message)
	},

	assertion: function(description, result) {
		message = '\t' + description + ': ' + result
		log.text(message)
	},

	status: function(message) {
		document.getElementById('status').innerHTML = message
	}
}

document.getElementById('start').addEventListener("click", start)

document.getElementById('show-log').addEventListener("click", function() {
	var log = document.getElementById('log')
	if(log.style.display === "none")
		log.style.display = "block"
	else
		log.style.display = "none"
})
