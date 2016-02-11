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