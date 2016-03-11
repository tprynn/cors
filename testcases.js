
/*
origin = {
	url: "http://sub.cors.tannerprynn.com"
}

server = {
	url: "http://cors.tannerprynn.com/",
	subdomain: "http://sub.sub.cors.tannerprynn.com/"
}
/*/
origin = {
	url: "http://sub.cors.localhost"
}

server = {
	url: "http://cors.localhost/",
	subdomain: "http://sub.sub.cors.localhost/",
	altport: "http://sub.cors.localhost:3000/"
}


prototype = {
	context: "a description of this test case",
	method: "GET,POST,...",
	server_ignore_method: "Methods the server should ignore, e.g. OPTIONS, for this request",
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
		},
		list: {
			includes: function(header, value) {
				return {
					description: "header list " + header + " includes value " + value,
					expect: function(req) {
						if(!req.get(header))
							return false

						var values = req.get(header).split(', ')
						for(var i = 0; i < values.length; i++) {
							if(values[i].toUpperCase() === value.toUpperCase()) {
								return true
							}
						}

						return false
					}
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
		},
		includes: function(key, bool) {
			return {
				description: "request " + (bool ? "does" : "doesn't") + " contain a " + key + " cookie",
				expect: function(req) {
					return bool === (req.cookies[key] != null)
				}
			}
		},
		value: function(key, value) {
			return {
				description: key + " cookie has value " + value,
				expect: function(req) {
					return req.cookies[key] === value
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
	},
	fail: {
		// this can be used for requests that should fail before even being sent
		// currently applies to CONNECT, TRACE, TRACK requests
		description: "the client SHOULD NOT have sent this request",
		expect: function(req) {
			return false
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


cases = [

	// Does XMLHttpRequest/CORS work? Basic Tests
	{
		context: "Basic GET XMLHttpRequest, ACAO: origin",
		method: "GET",
		url: server.url,
		request_headers: [],
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url]
		],
		expectations: [
			expectations.method("GET"),
			expectations.headers.origin,
			expectations.headers.value("Origin", origin.url),
			expectations.cookies.sent(false)
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
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

	/*********
	 *
	 * GET
	 *
	 *********/

	// Cookies
	{
		context: "Allow-Credentials true works correctly",
		method: "GET",
		url: server.url,
		creds: true,
		request_headers: [],
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", "true"]
		],
		expectations: [
			expectations.method("GET"),
			expectations.headers.origin,
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		context: "Allow-Credentials not present works correctly",
		method: "GET",
		url: server.url,
		creds: true,
		request_headers: [],
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Secret-Header", "Should Not Read"]
		],
		expectations: [],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},
	{
		context: "Allow-Credentials false works correctly",
		method: "GET",
		url: server.url,
		creds: true,
		request_headers: [],
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", "false"],
			["Secret-Header", "Should Not Read"]
		],
		expectations: [],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},
	{
		context: "Allow-Credentials blank works correctly",
		method: "GET",
		url: server.url,
		creds: true,
		request_headers: [],
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", ""],
			["Secret-Header", "Should Not Read"]
		],
		expectations: [],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},


	// Wildcard Origin
	{
		context: "wildcard allow-origin works correctly (GET)",
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"]
		],
		expectations: [
			expectations.method("GET"),
			expectations.headers.value("Origin", origin.url),
			expectations.cookies.sent(false)
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		context: "wildcard origin + credentials are incompatible",
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"],
			["Access-Control-Allow-Credentials", "true"],
			["Secret-Header", "somevalue"],
			["Set-Cookie", "test=blah"]
		],
		expectations: [
			expectations.method("GET"),
			expectations.headers.origin,
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false),
			assertions.headers.read("Set-Cookie", false)
		]
	},
	// Blank/Broken Origin
	{
		context: "blank origin is invalid (w/ creds)",
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: true,
		returned_headers: [
			["Access-Control-Allow-Origin", ""],
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
		context: "blank origin is invalid (w/o creds)",
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", "         "]
		],
		expectations: [
		],
		assertions: [
			assertions.body.read(false)
		]
	},
	{
		context: "list of origins is invalid (may be implementation dependent)",
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
	// Headers
	{
		context: "expose-headers works correctly w/o creds",
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Expose-Headers", "Secret-Header"],
			["Secret-Header", "Should Read"]
		],
		expectations: [
			expectations.method("GET"),
			expectations.cookies.sent(false)
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true),
			assertions.headers.read("Secret-Header", true)
		]
	},
	{
		context: "expose-headers works correctly w/ creds",
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
		context: "browser cannot access arbitrary headers (ACA no)",
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},
	{
		context: "browser cannot access arbitrary headers (ACA yes)",
		method: "GET",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"],
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
		],
		assertions: [
			assertions.body.read(true),
			assertions.headers.read("Secret-Header", false)
		]
	},
	{
		context: "browser cannot access Set-Cookie (ACA yes)",
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
		],
		assertions: [
			assertions.body.read(true),
			assertions.headers.read("Set-Cookie", false)
		]
	},
	{
		context: "modifying a request header triggers preflight",
		method: "GET",
		url: server.url,
		request_headers: [
			["Test", "someValue"]
		],
		creds: false,
		returned_headers: [
		],
		expectations: [
			expectations.method("OPTIONS"),
			expectations.headers.list.includes("Access-Control-Request-Headers", "Test"),
			expectations.cookies.sent(false)
		],
		assertions: [
			assertions.body.read(false)
		]
	},


	/*********
	 *
	 * POST
	 *
	 *********/

	 // basic tests
	 {
		context: "POST requests work w/o creds",
		method: "POST",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url]
		],
		expectations: [
			expectations.method("POST"),
			expectations.headers.origin,
			expectations.headers.value("Origin", origin.url),
			expectations.cookies.sent(false)
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		context: "POST requests work w/ creds",
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
			expectations.headers.origin,
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},	

	// wildcard origin
	{
		context: "wildcard origin works correctly (POST)",
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
		context: "wildcard origin + credentials are incompatible (POST)",
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

	// headers
	{
		context: "expose-headers works correctly w/o creds (POST)",
		method: "POST",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Expose-Headers", "Secret-Header"],
			["Secret-Header", "Should Read"]
		],
		expectations: [
			expectations.method("POST"),
			expectations.cookies.sent(false)
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true),
			assertions.headers.read("Secret-Header", true)
		]
	},
	{
		context: "expose-headers works correctly w/ creds (POST)",
		method: "POST",
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
			expectations.method("POST"),
			expectations.cookies.sent(true)
		],
		assertions: [
			assertions.body.read(true),
			assertions.headers.read("Secret-Header", true)
		]
	},
	{
		context: "browser cannot access arbitrary headers (ACA no) (POST)",
		method: "POST",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},
	{
		context: "browser cannot access arbitrary headers (ACA yes) (POST)",
		method: "POST",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Access-Control-Allow-Origin", "*"],
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
		],
		assertions: [
			assertions.body.read(true),
			assertions.headers.read("Secret-Header", false)
		]
	},

	// content-type
	{
		context: "POST w/ Content-Type application/x-www-form-urlencoded",
		method: "POST",
		url: server.url,
		request_headers: [
			["Content-Type", "application/x-www-form-urlencoded"]
		],
		creds: true,
		body: "key=value",
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", "true"]
		],
		expectations: [
			expectations.method("POST"),
			expectations.cookies.sent(true),
			expectations.headers.value("Content-Type", "application/x-www-form-urlencoded"),
			expectations.body.value("key=value")
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		context: "POST w/ Content-Type multipart/form-data",
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
			expectations.headers.value("Content-Type", "multipart/form-data")
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		context: "POST w/ Content-Type text/plain",
		method: "POST",
		url: server.url,
		request_headers: [
			["Content-Type", "text/plain"]
		],
		creds: true,
		body: "test",
		returned_headers: [
			["Access-Control-Allow-Origin", origin.url],
			["Access-Control-Allow-Credentials", "true"]
		],
		expectations: [
			expectations.method("POST"),
			expectations.cookies.sent(true),
			expectations.headers.value("Content-Type", "text/plain"),
			expectations.body.value("test")
		],
		assertions: [
			assertions.http.status(200),
			assertions.body.read(true)
		]
	},
	{
		context: "Changing to non-simple content-type triggers preflight (json)",
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
			expectations.headers.list.includes("Access-Control-Request-Headers", "Content-Type")
		],
		assertions: [
			assertions.body.read(false)
		]
	},
	{
		context: "Changing to non-simple content-type triggers preflight (html)",
		method: "POST",
		url: server.url,
		request_headers: [
			["Content-Type", "text/html"]
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
			expectations.headers.list.includes("Access-Control-Request-Headers", "Content-Type")
		],
		assertions: [
			assertions.body.read(false)
		]
	},
	{
		context: "Changing to non-simple content-type triggers preflight (custom)",
		method: "POST",
		url: server.url,
		request_headers: [
			["Content-Type", "custom"]
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
			expectations.headers.list.includes("Access-Control-Request-Headers", "Content-Type")
		],
		assertions: [
			assertions.body.read(false)
		]
	},

	/*********
	 *
	 * HEAD
	 *
	 *********/

	{
		context: "HEAD request works correctly",
		method: "HEAD",
		url: server.url,
		request_headers: [],
		body: "test",
		returned_headers: [
			["Access-Control-Allow-Origin", "*"],
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
			expectations.method("HEAD"),
			expectations.headers.origin,
			expectations.headers.value("Origin", origin.url),
			expectations.cookies.sent(false),
			expectations.body.sent(false)
		],
		assertions: [
			assertions.http.status(200),
			assertions.headers.read("Secret-Header", false)
			// not sure about this yet, HEAD shouldn't have a body?
			// ,assertions.body.read(true)
		]
	},

	/*********
	 *
	 * PUT
	 *
	 *********/

	{
		context: "PUT triggers a preflight",
		method: "PUT",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
			expectations.method("OPTIONS"),
			expectations.headers.origin,
			expectations.headers.value("Origin", origin.url),
			expectations.headers.value('Access-Control-Request-Method', 'PUT')
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},

	/*********
	 *
	 * PATCH
	 *
	 *********/

	{
		context: "PATCH triggers a preflight",
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
			expectations.headers.origin,
			expectations.headers.value("Origin", origin.url),
			expectations.headers.value('Access-Control-Request-Method', 'PATCH')
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},

	/*********
	 *
	 * DELETE
	 *
	 *********/

	{
		context: "DELETE triggers a preflight",
		method: "DELETE",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
			expectations.method("OPTIONS"),
			expectations.headers.origin,
			expectations.headers.value("Origin", origin.url),
			expectations.headers.value('Access-Control-Request-Method', 'DELETE')
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},

	/*********
	 *
	 * Dangerous methods
	 * CONNECT, TRACE, TRACK
	 *
	 *********/

	{
		context: "CONNECT causes a client-side error, no request sent",
		method: "CONNECT",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [],
		expectations: [
			expectations.fail
		],
		assertions: []
	},
	{
		context: "TRACE causes a client-side error, no request sent",
		method: "TRACE",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [],
		expectations: [
			expectations.fail
		],
		assertions: []
	},
	{
		context: "TRACK causes a client-side error, no request sent",
		method: "TRACK",
		url: server.url,
		request_headers: [],
		creds: false,
		returned_headers: [],
		expectations: [
			expectations.fail
		],
		assertions: []
	},

	/**********
	 *
	 * Same-Origin Policy
	 *
	 **********/

	// Subdomain of requesting domain
	{
		context: "Subdomain PUT triggers a preflight",
		method: "PUT",
		url: server.subdomain,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
			expectations.method("OPTIONS"),
			expectations.headers.origin,
			expectations.headers.value("Origin", origin.url),
			expectations.headers.value('Access-Control-Request-Method', 'PUT')
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},

	// Same domain, but with a different port
	{
		context: "Same-domain/different port: PUT triggers preflight",
		method: "PUT",
		url: server.altport,
		request_headers: [],
		creds: false,
		returned_headers: [
			["Secret-Header", "Should Not Read"]
		],
		expectations: [
			expectations.method("OPTIONS"),
			expectations.headers.origin,
			expectations.headers.value("Origin", origin.url),
			expectations.headers.value('Access-Control-Request-Method', 'PUT')
		],
		assertions: [
			assertions.body.read(false),
			assertions.headers.read("Secret-Header", false)
		]
	},
]

// a complex case has multiple individual cases which should be performed in order
complex_cases = [
	/***********
	 *
	 * METHODS
	 *
	 ***********/
	[
		{
			context: "PUT triggers a preflight",
			method: "PUT",
			server_ignore_method: "PUT",
			url: server.url,
			request_headers: [],
			creds: true,
			body: "F/+XGeMx",
			returned_headers: [
				["Access-Control-Allow-Origin", origin.url],
				["Access-Control-Allow-Methods", "PUT"],
				["Access-Control-Allow-Credentials", "true"]
			],
			expectations: [
				expectations.method("OPTIONS"),
				expectations.headers.origin,
				expectations.headers.value("Origin", origin.url),
				expectations.headers.value('Access-Control-Request-Method', 'PUT')
			],
			assertions: []
		},
		{
			context: "PUT request completes after valid ACAO",
			method: "PUT",
			server_ignore_method: "OPTIONS",
			url: server.url,
			request_headers: [],
			creds: true,
			body: "F/+XGeMx",
			returned_headers: [
				["Access-Control-Allow-Origin", origin.url],
				["Access-Control-Allow-Methods", "PUT"],
				["Access-Control-Allow-Credentials", "true"]
			],
			expectations: [
				expectations.method("PUT"),
				expectations.cookies.sent(true),
				expectations.body.value("F/+XGeMx")
			],
			assertions: []
		},
	],

	[
		{
			context: "Non-standard method triggers a preflight",
			method: "CUSTOM",
			server_ignore_method: "CUSTOM",
			url: server.url,
			request_headers: [],
			creds: true,
			body: "10EbLAUO",
			returned_headers: [
				["Access-Control-Allow-Origin", origin.url],
				["Access-Control-Allow-Method", "CUSTOM"],
				["Access-Control-Allow-Credentials", "true"]
			],
			expectations: [
				expectations.method("OPTIONS"),
				expectations.headers.origin,
				expectations.headers.value("Origin", origin.url),
				expectations.headers.value('Access-Control-Request-Method', 'CUSTOM')
			],
			assertions: []
		},
		{
			context: "Non-standard method completes after valid ACAO",
			method: "CUSTOM",
			server_ignore_method: "OPTIONS",
			url: server.url,
			request_headers: [],
			creds: true,
			body: "10EbLAUO",
			returned_headers: [
				["Access-Control-Allow-Origin", origin.url],
				["Access-Control-Allow-Method", "CUSTOM"],
				["Access-Control-Allow-Credentials", "true"]
			],
			expectations: [
				expectations.method("CUSTOM"),
				expectations.cookies.sent(true),
				expectations.body.value("10EbLAUO")
			],
			assertions: []
		},
	],
	
	/***********
	 *
	 * COOKIES
	 *
	 ***********/
	[
		{
			context: "Set-Cookie: GET/withCredentials false/ACAO yes",
			method: "GET",
			url: server.url,
			creds: false,
			request_headers: [],
			returned_headers: [
				["Access-Control-Allow-Origin", origin.url],
				["Access-Control-Allow-Credentials", "true"],
				["Set-Cookie", "SDH0U0d6=zV2Ax0VS"]
			],
			expectations: [],
			assertions: [
				assertions.body.read(true)
			]
		},
		{
			context: "Browser should not set the returned cookie",
			method: "GET",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Set-Cookie", "SDH0U0d6=; expires=Thu, 01 Jan 1970 00:00:00 GMT"]
			],
			expectations: [
				expectations.cookies.includes("SDH0U0d6", false)
			],
			assertions: []
		}
	],

	[
		{
			context: "Set-Cookie: GET/withCredentials true/ACAO yes",
			method: "GET",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Access-Control-Allow-Origin", origin.url],
				["Access-Control-Allow-Credentials", "true"],
				["Set-Cookie", "rOzpwI1V=vJRmwrwu"]
			],
			expectations: [],
			assertions: [
				assertions.body.read(true)
			]
		},
		{
			context: "Browser should set the returned cookie",
			method: "GET",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Set-Cookie", "rOzpwI1V=; expires=Thu, 01 Jan 1970 00:00:00 GMT"]
			],
			expectations: [
				expectations.cookies.includes("rOzpwI1V", true),
				expectations.cookies.value("rOzpwI1V", "vJRmwrwu")
			],
			assertions: []
		}
	],

	[
		{
			context: "Set-Cookie: GET/withCredentials true/ACAO no",
			method: "GET",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Set-Cookie", "ab9qEo3O=qFbA+www"]
			],
			expectations: [],
			assertions: [
				assertions.body.read(false)
			]
		},
		{
			context: "Browser should not set the returned cookie",
			method: "GET",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Set-Cookie", "ab9qEo3O=; expires=Thu, 01 Jan 1970 00:00:00 GMT"]
			],
			expectations: [
				expectations.cookies.includes("ab9qEo3O", false)
			],
			assertions: []
		}
	],

	[
		{
			context: "Set-Cookie: GET/withCredentials true/ACAO wildcard",
			method: "GET",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Access-Control-Allow-Origin", "*"],
				["Access-Control-Allow-Credentials", "true"],
				["Set-Cookie", "9GE20n9K=rc5m3zSm"]
			],
			expectations: [],
			assertions: [
				assertions.body.read(false)
			]
		},
		{
			context: "Browser should not set the returned cookie",
			method: "GET",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Set-Cookie", "9GE20n9K=; expires=Thu, 01 Jan 1970 00:00:00 GMT"]
			],
			expectations: [
				expectations.cookies.includes("9GE20n9K", false)
			],
			assertions: []
		}
	],

	[
		{
			context: "Set-Cookie: POST/withCredentials false/ACAO yes",
			method: "POST",
			url: server.url,
			creds: false,
			request_headers: [],
			returned_headers: [
				["Access-Control-Allow-Origin", origin.url],
				["Access-Control-Allow-Credentials", "true"],
				["Set-Cookie", "l04zVfqe=Q63BcWy"]
			],
			expectations: [],
			assertions: [
				assertions.body.read(true)
			]
		},
		{
			context: "Browser should not set the returned cookie",
			method: "GET",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Set-Cookie", "l04zVfqe=; expires=Thu, 01 Jan 1970 00:00:00 GMT"]
			],
			expectations: [
				expectations.cookies.includes("l04zVfqe", false)
			],
			assertions: []
		}
	],

	[
		{
			context: "Set-Cookie: POST/withCredentials true/ACAO yes",
			method: "POST",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Access-Control-Allow-Origin", origin.url],
				["Access-Control-Allow-Credentials", "true"],
				["Set-Cookie", "7oHXBu1=0lw3EXDe"]
			],
			expectations: [],
			assertions: [
				assertions.body.read(true)
			]
		},
		{
			context: "Browser should set the returned cookie",
			method: "GET",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Set-Cookie", "7oHXBu1=; expires=Thu, 01 Jan 1970 00:00:00 GMT"]
			],
			expectations: [
				expectations.cookies.includes("7oHXBu1", true),
				expectations.cookies.value("7oHXBu1", "0lw3EXDe")
			],
			assertions: []
		}
	],
	[
		{
			context: "Set-Cookie: POST/withCredentials true/ACAO bad",
			method: "POST",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Access-Control-Allow-Origin", "*"],
				["Access-Control-Allow-Credentials", "true"],
				["Set-Cookie", "h5fg0q8e=Q63BcWy"]
			],
			expectations: [],
			assertions: []
		},
		{
			context: "Browser should not set the returned cookie",
			method: "GET",
			url: server.url,
			creds: true,
			request_headers: [],
			returned_headers: [
				["Set-Cookie", "h5fg0q8e=; expires=Thu, 01 Jan 1970 00:00:00 GMT"]
			],
			expectations: [
				expectations.cookies.includes("h5fg0q8e", false)
			],
			assertions: []
		}
	],

	/**********
	 *
	 * Same-Origin
	 *
	 **********/

	// Alternate Port
	[
		{
			context: "Alternate Port Set-Cookie",
			method: "GET",
			url: server.altport,
			request_headers: [],
			creds: true,
			returned_headers: [
				["Access-Control-Allow-Origin", origin.url],
				["Access-Control-Allow-Credentials", "true"],
				["Set-Cookie", "T4mWZT0B=bJdC+GA/"]
			],
			expectations: [],
			assertions: []
		},
		{
			context: "Alternate Port request should not send creds by default",
			method: "GET",
			url: server.altport,
			request_headers: [],
			creds: false,
			returned_headers: [],
			expectations: [
				expectations.cookies.sent(false)
			],
			assertions: []
		},
		{
			context: "Alternate Port request should still trigger CORS checks",
			method: "GET",
			url: server.altport,
			request_headers: [],
			creds: true,
			returned_headers: [
				["Secret-Header", "Should Not Read"],
				["Set-Cookie", "T4mWZT0B=; expires=Thu, 01 Jan 1970 00:00:00 GMT"]
			],
			expectations: [
				expectations.cookies.includes("T4mWZT0B", true),
				expectations.cookies.value("T4mWZT0B", "bJdC+GA/")
			],
			assertions: [
				assertions.body.read(false),
				assertions.headers.read("Secret-Header", false)
			]
		},

	],

	// Subdomain of current domain
	[
		{
			context: "Subdomain Set-Cookie",
			method: "GET",
			url: server.subdomain,
			request_headers: [],
			creds: true,
			returned_headers: [
				["Access-Control-Allow-Origin", origin.url],
				["Access-Control-Allow-Credentials", "true"],
				["Set-Cookie", "vF1IPBbY=+dkM8bIJ"]
			],
			expectations: [],
			assertions: []
		},
		{
			context: "Subdomain request should not send creds by default",
			method: "GET",
			url: server.altport,
			request_headers: [],
			creds: false,
			returned_headers: [],
			expectations: [
				expectations.cookies.sent(false)
			],
			assertions: []
		},
		{
			context: "Subdomain request should still trigger CORS checks",
			method: "POST",
			url: server.subdomain,
			request_headers: [],
			creds: true,
			returned_headers: [
				["Secret-Header", "Should Not Read"],
				["Access-Control-Allow-Origin", "*"],
				["Access-Control-Allow-Credentials", "true"],
				["Set-Cookie", "vF1IPBbY=; expires=Thu, 01 Jan 1970 00:00:00 GMT"]
			],
			expectations: [
				expectations.method("POST"),
				expectations.cookies.includes("vF1IPBbY", true),
				expectations.cookies.value("vF1IPBbY", "+dkM8bIJ")
			],
			assertions: [
				assertions.body.read(false),
				assertions.headers.read("Secret-Header", false)
			]
		}
	]
]

if(typeof module !== 'undefined' && module.exports) {
	uuid_validate = function(id) {
		if(id) return id.match(/^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$/) != null
		return false
	}

	exports.expectations = expectations
	// exports.assertions = assertions
	exports.cases = cases
	exports.complex_cases = complex_cases
}
