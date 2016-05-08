"use strict";

var WebSocketServer = require('websocket').server;
var connections=[], conId=1;
var listeners={};
var options;


function init(server, opt) {
	options = opt;

	var wsServer = new WebSocketServer({httpServer: server, autoAcceptConnections: false});

	wsServer.on('request', function(request) {
		validateRequest(request, options.allowedOrigin, options.allowedProtocol);
	});

	wsServer.on('connect', newConnection);
}


function newConnection(con) {
	con.id = conId++;
	con.on('message', function(message) {
		incomingMessage(con, message);
	});
	con.on('close', function(reasonCode, description) {
		console.log("Connection " + con.id + " closed. ", reasonCode, description);
		var index = connections.indexOf(con);
		if(index >= 0) connections.splice(index, 1);
		console.log("Number of connected users:", connections.length, connections.map(function(c) { return "con " + c.id }));
	});
	connections.push(con);
	console.log("Number of connected users:", connections.length, connections.map(function(c) { return "con " + c.id }));
	if(options.connectCallback) options.connectCallback(con);
}


function incomingMessage(con, message) {
	if(message.type !== 'utf8') {
		console.error("Invalid message", message);
		return;
	}
	var data = JSON.parse(message.utf8Data);
	var type = data.sockerMessageType;
	if(!type) {
		console.error("Empty message type", data);
		return;
	}
	delete data.sockerMessageType;


	if(listeners.hasOwnProperty(type)) {
		listeners[type].forEach(function(callback) {
			console.log("Message from connection " + con.id + ":", type, data);
			callback(con, data, type);
		});
	} else {
		console.log("Unhandled message from connection " + con.id + ":", type, data);
	}
}


function validateRequest(request, allowedOrigin, allowedProtocol) {
	console.log("Incoming connection from ", request.remoteAddress, "with origin:", request.origin, "requestedProtocols:", request.requestedProtocols);
	if (allowedOrigin && allowedOrigin !== request.origin) {
		console.log("Origin not allowed:", request.origin, allowedOrigin);
		request.reject();
	} else if (allowedProtocol && request.requestedProtocols.indexOf(allowedProtocol) === -1) {
		console.log("Protocols not allowed:", request.requestedProtocols);
		request.reject();
	} else {
		request.accept(allowedProtocol, allowedOrigin);
	}
}

function addMessageListener(type, callback) {
	if(!listeners.hasOwnProperty(type)) listeners[type] = [];
	listeners[type].push(callback);
}

function sendMessageTo(con, type, payload) {
	payload.sockerMessageType = type;
	con.sendUTF(JSON.stringify(payload));
}

function sendMessageToAll(type, payload) {
	sendMessageToAllBut(type, payload, null);
}

function sendMessageToAllBut(type, payload, exclude) {
	connections.forEach(function(con) {
		if(con !== exclude) {
			sendMessageTo(con, type, payload);
		}
	});
}


module.exports = {
	init: init,
	on: addMessageListener,
	sendTo: sendMessageTo,
	sendToAll: sendMessageToAll,
	sendToAllBut: sendMessageToAllBut
};