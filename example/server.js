var socker = require('../lib/socker').server;
var express = require('express');

var app = express.createServer();

app.configure(function() {
    app.use(express.static(__dirname + "/public"));
});
app.listen(8080);


socker.init(app, {
    allowedOrigin: "http://localhost:8080",
    allowedProtocol: "socker-test"
});

socker.on("ping", function(con, data, type) {
	console.log("incoming message", type, data);
	socker.sendToAll("pong", data);
});
