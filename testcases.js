prototype = {
	method: "GET,POST,...",
	url: "example.com",
	request_headers: [
		["key", "value"],
		["key2", "value"]
	],
	creds: true,
	returned_headers: [
		["key", "value"]
	],
	expectations: [
		{
			description: "server checks this expectation against the client's request",
			expect: function(req) { check(req.someValue) }
		}
	],
	assertions: [
		{
			description: "client checks this assertion against the server's response",
			assert: function(xhr) { check(xhr.someValue) }
		}
	]

}

expectations = {
	method: function(method) {
		return {
			description: "http method " + method,
			expect: function(req) {
				return req.method === method
			}
		}
	}
}

assertions = {
	http: {
		status: function(status) {
			return {
				description: "http status " + status,
				assert: function(xhr) {
					return xhr.status === status
				}
			}
		}
	},

	body: {
		read: function(bool) {
			return {
				description: (bool ? "can" : "cannot") + " read body",
				assert: function(xhr) {
					canreadbody = false
					if(xhr.response) {
						canreadbody = true
					}
					return bool === canreadbody
				}
			}
		}
	},

	header: {
		read: function(header, bool) {
			return {
				description: (bool ? "can" : "cannot") + " read header " + header,
				assert: function(xhr) {
					canreadheader = false
					if(xhr.getResponseHeader(header)) {
						canreadheader = true
					}
					return bool === canreadheader
				}
			}
		}
	}
}

server = {
	url: "http://localhost:3000/"
}

cases = [
	{
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"]
		],
		expectations: [
			expectations.method("GET")
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
		],
		expectations: [
			expectations.method("GET")
		],
		assertions: [
			assertions.body.read(false)
		]
	},
	{
		method: "POST",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"]
		],
		expectations: [
			expectations.method("POST")
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		method: "HEAD",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"]
		],
		expectations: [
			expectations.method("HEAD")
		],
		assertions: [
			assertions.http.status(200)
			// not sure about this yet, HEAD shouldn't have a body?
			// ,assertions.body.read(true)
		]
	}
]	

if(typeof module !== 'undefined' && module.exports) {
	exports.expectations = expectations
	// exports.assertions = assertions
	exports.cases = cases
}
