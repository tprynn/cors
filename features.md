Request headers
==================
Origin
Access-Control-Request-Method
Access-Control-Request-Headers

Response headers
==================
Access-Control-Allow-Origin
Access-Control-Allow-Credentials
Access-Control-Expose-Headers
Access-Control-Max-Age
Access-Control-Allow-Methods
Access-Control-Allow-Headers

# Pitfalls of the standard
	* Nobody knows what a simple request is
		- All POST endpoints w/o tokens are CSRFable (modulo OAuth/content-type restrictions)
		- Client Certs?
		- Your framework may coerce the content-type (see: node)
	* Nobody knows when cookies will be set
	* People have state-changing GET/HEAD endpoints
	* All local network sites are vulnerable (internal sites, network devices, ...)
		- Your browser is BEHIND the firewall/VPN, and has creds for all your "secure" sites
		- Yes, this includes client certs
	* what the heck happens on a redirect?

# Do browsers even get the standard right?
## Requests
	* What requests cause a pre-flight OPTIONS?
	* What Headers are included with a request?
		- Origin
		- Referrer?
		- Can users modify these headers? Submit multiple headers?
	* Simple requests
		- GET, HEAD, POST
		- Cookies OK
		- Client Certs ??
	* What happens when a request gets redirected? E.g. OPTIONS

## Preflights
	* Access-Control-Request-Methods
		- single method
	* Access-Control-Request-Headers
		- the spec doesn't even say whether this is a list, or single item...

## Response
	* when can you read the response?
		- See Origin
	* Access-Control-Expose-Headers
		- List of headers to allow
		- header1, header2, ...
	* What headers can we read (without valid origin)?
		* Simple headers
			- Cache-Control
			- Content-Language
			- Content-Type
			- Expires
			- Last-Modified
			- Pragma
		* Can we read other headers? Custom ones?
		* xhr.getResponseHeader()
	* When does a response set cookies?
		- valid/invalid
		- GET/HEAD/POST/OPTIONS
		- session fixation attacks

## Headers
	* Access-Control-Allow-Headers
	* Case-insensitive
	* Simple headers
		- Accept, Accept-Language, or Content-Language
		- Content-Type: {application/x-www-form-urlencoded, multipart/form-data, text/plain}

## Origin
	* When does the browser set the origin header?
	* Access-Control-Allow-Origin
		- is it respected?
		- wildcard
		- empty
		- subdomains
		- lists? null?
	* subdomains
		- a.example.com -> b.example.com
		- a.example.com <-> example.com
		- example.com.attacker.com -> example.com

		example.com.example.com <-> example.com

## Credentials
	* Cookies
	* Authorization

## Methods
	* Access-Control-Allow-Methods
		- wildcard
		- empty
		- trailing comma
	* Simple requests OK
		- GET, POST, HEAD w/ creds
	* Other methods require pre-flight
		- PUT, PATCH, UPDATE, DELETE
	* Case-sensitive

## Age
	* Access-Control-Max-Age
		- Max time in seconds to cache the OPTIONS response
		- negative, zero, normal time
		- multiple requests
	* Cache is really weird, do browsers handle caching correctly?
		- Method/Header entries are mutually exclusive?

## Types of CSR
	* GET
		- img src
		- script src
		- form target
		- ?
	* POST
		- form target
	* XMLHTTPRequest
	* XDomainRequest (IE8,9)

# Which browsers should we test?

## Desktop Browsers
	* Chrome
		- SRWare Iron
	* Firefox
	* Safari
	* IE 
		- versions?
	* Opera
	* PhantomJS

## Mobile Browsers
	* Android Stock
	* Chrome
	* Firefox
	* UC Browser
	* Dolphin
	* IE/WinMobile
	* Blackberry?

