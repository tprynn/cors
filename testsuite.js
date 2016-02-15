
uuid = 'default-id'
requests = []

start = function() {
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

run_tests = function() {
	var queued_tests = []
	var running_tests = []
	var finished_tests = []

	var n_parallel_requests = 3
	
	for (var test_index = 0; test_index < cases.length; test_index++) {
		queued_tests.push(test_index)
	}

	var intervalId = setInterval(function() {
		// console.log('Queued: ' + queued_tests)
		// console.log('Running: ' + running_tests)
		// console.log('Finished: ' + finished_tests)

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
				clearInterval(intervalId)
			}
		}

		// check each running test to see if it's finished, and move to finished tests
		for(var i = 0; i < running_tests.length; i++) {
			var test = running_tests[i]
			if(test.xhr.readyState == XMLHttpRequest.DONE) {
				finished_tests.push(test)
				running_tests[i] = null
			}
		}

		// if < n_parallel running tests, pop tests from queue and start them
		if(queued_tests.length === 0){
			return
		}

		for(var i = 0; i < n_parallel_requests; i++) {
			if(!running_tests[i]) {
				var test_index = queued_tests.shift()
				var test = run_test(test_index)
				running_tests[i] = test
			}
		}
	}, 200)
}

run_test = function(test_index, manual_test_obj) {
	var index = test_index
	var test = cases[test_index]

	var xhr = new XMLHttpRequest()
	var xhrobj = {"xhr": xhr, "testcase": test}

	var params = 'uuid=' + encodeURIComponent(uuid)
	xhr.open(test.method, test.url + 'testcase/' + test_index + '?' + params)
	
	for (var i = 0; i < test.request_headers.length; i++) {
		var header = test.request_headers[i]
		xhr.setRequestHeader(header[0], header[1])
	}

	xhr.withCredentials = test.creds
 
	xhr.onreadystatechange = function() {
		if (xhr.readyState == XMLHttpRequest.DONE) {
			log('test ' + index + ' ' + test.method)
			var n_assertions = test.assertions.length
			for (var i = 0; i < n_assertions; i++) {
				var assertion = test.assertions[i]
				assertion.result = assertion.assert(xhr)
				log('\t' + assertion.description + ': ' + assertion.result)
			}
		}
	}

	xhr.send(test.body)

	requests.push(xhrobj)
	return xhrobj
}

log = function(text) {
	document.getElementById('log').innerText += text + '\n'
	console.log(text)
}

start()
