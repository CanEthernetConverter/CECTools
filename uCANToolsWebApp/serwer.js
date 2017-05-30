var http = require('http');
var serveStatic = require('serve-static');
var io_client = require('socket.io-client');
var express = require('express');
var bodyParser = require('body-parser');
var jsonfile = require('jsonfile');
var app = express();
var fs = require('fs');
var SerialPort = require("serialport");
var os = require("os");
var net = require('net');
var config = require('./../config.json');
require('./logging.js');
var slcan = require('./vcom_slcan.js');

// TELNET SOCKET
var clients = [];

net.createServer(function (socket) {
  socket.setNoDelay(true);
  clients.push(socket);
  console.log("connected from " + socket.remoteAddress);
  socket.on('data', function (data) {
    console.log('C<' + data.toString());
    slcan.port.write(data);
  });

  socket.on('close', function() {
    console.log("removed " + socket.remoteAddress);
    clients.splice(clients.indexOf(socket),1)
  });

  socket.on('error', function() {
    console.log("error " + socket.remoteAddress);
    clients.splice(clients.indexOf(socket),1)
  });

}).listen(config.SocketPort);

function broadcast(message) {
  clients.map((client) => {
    client.write(message);
  });
}

// set handler
slcan.onCOMDataRx(broadcast);

// HTTP SERVER AND SOCKET IO
var server = http.createServer(app);
server.listen(config.HTTPPort, function () {
  console.log('uCANToolWebSerwer app listening on port '+ config.HTTPPort)
})

var io = require('socket.io')(server); //listen trafic on HTTPPort

slcan.onPacketRx((endpoint,data) => {
    io.sockets.emit(endpoint, data);
});

// -------------PIPE DATA TO SLCAN_DRIVER-------------
io.sockets.on('connection', function (socket) {
  console.log("HTTP Client connected" + socket);
  socket.on('CANtx', function (data) {
		console.log('C<' + data.toString());
    slcan.port.write(data.toString());
  });
});

// handling post request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(__dirname));
app.get("/", function(req, res) {
	 res.sendFile('index.html')
});


function resetDevice(){
    require('child_process').exec('sudo /sbin/shutdown -r now', function (msg) {console.log(msg)});
    console.log("--- Device Reset ---");
}

var CANConfigJSON = __dirname + '/../config.json';
app.put("/CAN/config.json", function (req, res) {
    jsonfile.writeFile(CANConfigJSON, req.body);
    console.log('New config');
    console.log(req.body);
    res.send(JSON.stringify("OK"));
    setTimeout(resetDevice,3000);
  
});

app.get("/CAN/config.json", function (req, res) {
	obj = JSON.parse(fs.readFileSync(CANConfigJSON, 'utf8'));
	console.log("READ");
	console.log(obj);
	res.send(JSON.stringify(obj));
});


app.get("/CAN/log_files.json", function (req, res) {
console.log("List dir ");
	fs.readdir(config.CANLogDir, function(err, items) {
	    console.log(items);
			res.send(JSON.stringify(items));
	});
});

console.log('Socket on ' + config.SocketPort);
