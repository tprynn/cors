<?

# mirror requested headers
$headers = explode(';', $_GET['headers']);
foreach ($headers as $header) {
	header($header, false);
}

# apply requested cookies
if(isset($_GET['cookie'])) {
	setcookie('cookie', $_GET['cookie']);
}

# return the request as a json struct
header("Content-Type: application/json", false);

$output = [
	"method" => $_SERVER['REQUEST_METHOD'],
	"host" => $_SERVER['HTTP_HOST'],
	"uri" => $_SERVER['REQUEST_URI'],
	"headers" => getallheaders(),
	"content" => file_get_contents("php://input")
];

echo json_encode($output, JSON_PRETTY_PRINT);



#error_reporting(E_ALL);
#ini_set('display_errors', '1');


# evaluate expectations
// $expects = preg_split(';', $_GET['expect']);
// foreach ($expect as $expect) {
// 	switch ($expect) {
// 		case "OPTIONS":
// 			# browser should have sent an OPTIONS request
// 			break;
// 		default:
// 			break;
// 	}
// }
?>