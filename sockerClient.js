var Socker = (function() {
	var socket,
		connected = false,
		messageListeners = {},
		sendQueue = [];


	function connect(url, protocol, openCallback, closeCallback, errorCallback) {
		socket = new WebSocket(url, protocol);
		socket.addEventListener("open", connectionEstablished);
		socket.addEventListener("error", connectionFailed);
		socket.addEventListener("close", connectionClosed);
		socket.addEventListener("message", messageReceived);

		function connectionEstablished(e) {
			console.log("connectionEstablished", e);
			processSendQueue();
			if(openCallback) openCallback();
		}

		function connectionClosed(e) {
			connected = false;
			console.log("Connection was closed", e);
			if(closeCallback) closeCallback();
		}

		function connectionFailed(e) {
			connected = false;
			console.log("Can not connect to websocket", e);
			if(errorCallback) errorCallback();
		}


		function messageReceived(e) {
			try {
				var data = JSON.parse(e.data);
			} catch(e) {
				console.error("Error parsing message", e);
			}

			var type = data.sockerMessageType;
			delete data.sockerMessageType;

			if(messageListeners.hasOwnProperty(type)) {
				messageListeners[type].forEach(function(callback) {
					callback(data, type);
				});
			} else {
				console.warn("Incoming discarded message", type, data);
			}
		}
	}



	function sendMessage(type, payload) {
		payload.sockerMessageType = type;
		if(isConnected()) {
			console.log("Send", payload);
			socket.send(JSON.stringify(payload));
		} else {
			sendQueue.push(payload);
		}
	}

	function processSendQueue() {
		while(isConnected() && sendQueue.length>0) {
			var message = sendQueue.shift();
			var type = message.sockerMessageType;
			delete message.sockerMessageType;
			sendMessage(type, message);
		}
	}

	function addMessageListener(type, callback) {
		if(!messageListeners.hasOwnProperty(type)) messageListeners[type] = [];
		messageListeners[type].push(callback);
	}

	function isConnected() {
		return socket.readyState === 1;
	}


	return {
		connect: connect,
		send: sendMessage,
		on: addMessageListener,
		connected: isConnected
	}
}());