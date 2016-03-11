

From wikipedia, 2/8/2016
> "Cross-domain" AJAX requests are forbidden by default because of their ability to perform advanced requests (POST, PUT, DELETE and other types of HTTP requests, along with specifying custom HTTP headers) that introduce many cross-site scripting security issues.


Origin header: is it set on all cross-site requests?

Cookies are set in all requests with withCredentials true

Add tests for sub.sub.cors, different port

dangerous methods CONNECT,TRACE,TRACK



xhr = new XMLHttpRequest()
xhr.open(method, url)
xhr.send(data)
setRequestHeader(key, value)
withCredentials = true
	- default: false
	- if false, ignore creds in response

onreadystatechange = function() {
	if (xhr.readystate == XMLHttpRequest.DONE) {

	}
}

getResponseHeader(header)
getAllResponseHeaders()
status
statusText
response
responseText

overrideMimeType
responseXML
