
uuid = 'default-id'
requests = []

start = function() {
	var xhr = new XMLHttpRequest()
	xhr.open('GET', server.url + 'id/new')
	xhr.send()

	xhr.onreadystatechange = function() {
		if(xhr.readyState == XMLHttpRequest.DONE) {
			uuid = xhr.responseText
			run_tests()
		}
	}
}

run_tests = function() {
	for (var test_index = 0; test_index < cases.length; test_index++) {
		run_test(test_index)
	}
}

run_test = function(test_index) {
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
			console.log('test ' + index + ' ' + test.method)
			var n_assertions = test.assertions.length
			for (var i = 0; i < n_assertions; i++) {
				var assertion = test.assertions[i]
				assertion.result = assertion.assert(xhr)
				console.log('\t' + assertion.description + ': ' + assertion.result)
			}
		}
	}

	xhr.send(test.data)

	requests.push(xhrobj)
}

start()
