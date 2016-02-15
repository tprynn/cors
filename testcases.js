prototype = {
	method: "GET,POST,...",
	url: "example.com",
	request_headers: [
		["key", "value"],
		["key2", "value"]
	],
	creds: true,
	body: "content to send in the body",
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

	// preflight: {
	// 	// if preflight is present, respond to OPTIONS but don't run tests for it
	// 	allow_origin: "origin",
	// 	allow_headers: "header, header", // browser can send these in its request
	// 	allow_credentials: "true|false",
	// 	allow_methods: "GET, POST",
	// 	expose_headers: "header, header", // browser can access these?
	// 	max_age: "seconds" // max number of seconds to cache this request
	// },

expectations = {
	method: function(method) {
		return {
			description: "http method " + method,
			expect: function(req) {
				return req.method === method
			}
		}
	},
	headers: {
		origin: {
			description: "includes Origin header",
			expect: function(req) {
				if(req.get('Origin')) return true
				return false
			}
		},
		value: function(header, expected) {
			return {
				description: "header " + header + " has value " + expected,
				expect: function(req) {
					if(req.get(header)) {
						return req.get(header).toUpperCase() === expected.toUpperCase()
					}
					return expected !== null
				}
			}
		}
	},
	cookies: {
		sent: function(bool) {
			return {
				description: "request " + (bool ? "does" : "doesn't") + " contain cookies",
				expect: function(req) {
					return bool === uuid_validate(req.cookies.uuid)
				}
			} 
		} 
	},
	body: {
		sent: function(bool) {
			return {
				description: "request " + (bool ? "has" : "doesn't have") + " a body",
				expect: function(req) {
					if(req.body) {
						return true
					}
					return false
				}
			}
		},
		value: function(content) {
			return {
				description: "request body has expected content",
				expect: function(req) {
					return req.body === content
				}
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
					var canreadbody = false
					if(xhr.response) {
						canreadbody = true
					}
					return bool === canreadbody
				}
			}
		}
	},

	headers: {
		read: function(header, bool) {
			return {
				description: (bool ? "can" : "cannot") + " read header " + header,
				assert: function(xhr) {
					var canreadheader = false
					if(xhr.getResponseHeader(header)) {
						canreadheader = true
					}
					return bool === canreadheader
				}
			}
		}
	}
}

origin = {
	url: "http://localhost:4444"
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
			expectations.method("GET"),
			expectations.headers.origin,
			expectations.cookies.sent(false)
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
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"],
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
			expectations.method("GET"),
			expectations.headers.origin,
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},
	{
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"],
			["Access-Control-Allow-Credentials", "true"],
			["Secret-Header", "Should Not Read"],
			["Set-Cookie", "test=blah"]
		],
		expectations: [
			expectations.method("GET"),
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false),
			assertions.headers.read("Set-Cookie", false)
		]
	},
	{
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", "true"],
			["Set-Cookie", "test=blah"]
		],
		expectations: [
			expectations.method("GET"),
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true),
			assertions.headers.read("Set-Cookie", false)
		]
	},
	{
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", ""],
			["Access-Control-Allow-Credentials", "true"],
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
			expectations.method("GET"),
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},
	{
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", "true"],
			["Access-Control-Expose-Headers", "Secret-Header"],
			["Secret-Header", "Should Read"]
		],
		expectations: [
			expectations.method("GET"),
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.body.read(true),
			assertions.headers.read("Secret-Header", true)
		]
	},
	{
		method: "GET",
		url: server.url,
		request_headers: [
			["Test", "someValue"]
		],
		creds: true,
		returned_headers: [
		],
		expectations: [
			expectations.method("OPTIONS"),
			expectations.headers.value("Access-Control-Request-Headers", "Test"),
			expectations.cookies.sent(false)
		],
		assertions: [
			assertions.body.read(false)
		]
	},
	{
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", ""],
			["Access-Control-Allow-Credentials", "true"]
		],
		expectations: [
		],
		assertions: [
			assertions.body.read(false)
		]
	},
	{
		context: "list of origins is NOT valid (may be implementation dependent)",
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url + ", somesite.example.com"]
		],
		expectations: [
		],
		assertions: [
			assertions.body.read(false)
		]
	},
	{
		context: "GET requests should not include a body",
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: false,
		body: "test",
		returned_headers: [
		],
		expectations: [
			expectations.body.sent(false)
		],
		assertions: [
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
			expectations.method("POST"),
			expectations.headers.origin
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},	
	{
		method: "POST",
		url: server.url,
		request_headers: [],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"],
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
			expectations.method("POST"),
			expectations.headers.origin,
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},
	{
		method: "POST",
		url: server.url,
		request_headers: [],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"],
			["Access-Control-Allow-Credentials", "true"]
		],
		expectations: [
			expectations.method("POST"),
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.body.read(false)
		]
	},
	{
		method: "POST",
		url: server.url,
		request_headers: [],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", "true"]
		],
		expectations: [
			expectations.method("POST"),
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		method: "POST",
		url: server.url,
		request_headers: [
			["Content-Type", "application/x-www-form-urlencoded"]
		],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", "true"]
		],
		expectations: [
			expectations.method("POST"),
			expectations.cookies.sent(true),
			expectations.headers.value("Content-Type", "application/x-www-form-urlencoded")
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		method: "POST",
		url: server.url,
		request_headers: [
			["Content-Type", "multipart/form-data"]
		],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", "true"]
		],
		expectations: [
			expectations.method("POST"),
			expectations.cookies.sent(true),
			expectations.headers.value("Content-Type", "application/x-www-form-urlencoded")
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		method: "POST",
		url: server.url,
		request_headers: [
			["Content-Type", "text/plain"]
		],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", "true"]
		],
		expectations: [
			expectations.method("POST"),
			expectations.cookies.sent(true),
			expectations.headers.value("Content-Type", "application/x-www-form-urlencoded")
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		method: "POST",
		url: server.url,
		request_headers: [
			["Content-Type", "application/json"]
		],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", "true"]
		],
		expectations: [
			expectations.method("OPTIONS"),
			expectations.cookies.sent(false),
			expectations.headers.value("Access-Control-Allow-Origin", origin.url),
			expectations.headers.value("Access-Control-Request-Method", "POST"),
			expectations.headers.value("Access-Control-Request-Headers", "Content-Type")
		],
		assertions: [
			assertions.body.read(false)
		]
	},
	{
		method: "HEAD",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"],
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
			expectations.method("HEAD")
		],
		assertions: [
			assertions.http.status(200),
			assertions.headers.read("Secret-Header", false)
			// not sure about this yet, HEAD shouldn't have a body?
			// ,assertions.body.read(true)
		]
	},
	{
		method: "PUT",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
			expectations.method("OPTIONS"),
			expectations.headers.value('Access-Control-Request-Method', 'PUT')
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},
	{
		method: "PATCH",
		url: server.url,
		request_headers: [
			["Secret-Header", "Should Not Read"]
		],
		creds: false,
		returned_headers: [
		],
		expectations: [
			expectations.method("OPTIONS"),
			expectations.headers.value('Access-Control-Request-Method', 'PATCH')
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},
	{
		method: "DELETE",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
			expectations.method("OPTIONS"),
			expectations.headers.value('Access-Control-Request-Method', 'DELETE')
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},
]	

if(typeof module !== 'undefined' && module.exports) {
	uuid_validate = function(id) {
		if(id) return id.match(/^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$/) != null
		return false
	}

	exports.expectations = expectations
	// exports.assertions = assertions
	exports.cases = cases
}
