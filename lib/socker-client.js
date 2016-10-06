var socker = (function() {
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
			processSendQueue();
			if(openCallback) openCallback(e);
			else console.log("connectionEstablished", e);
		}

		function connectionClosed(e) {
			connected = false;
			if(closeCallback) closeCallback(e);
			else console.log("Connection was closed", e);
		}

		function connectionFailed(e) {
			connected = false;
			if(errorCallback) errorCallback(e);
			else console.log("Can not connect to websocket", e);
		}


		function messageReceived(e) {
			try {
				var payload = JSON.parse(e.data);
			} catch(e) {
				console.error("Error parsing message", e);
			}

			var type = payload.type;
			var data = payload.data;

			if(messageListeners.hasOwnProperty(type)) {
				messageListeners[type].forEach(function(callback) {
					callback(data, type);
				});
			} else {
				console.warn("Incoming discarded message", type, data);
			}
		}
	}



	function sendMessage(type, data) {
		var payload = {type: type, data:data};
		if(isConnected()) {
			console.log("Send", payload);
			socket.send(JSON.stringify(payload));
		} else {
			sendQueue.push(payload);
		}
	}

	function processSendQueue() {
		while(isConnected() && sendQueue.length>0) {
			var payload = sendQueue.shift();
			socket.send(JSON.stringify(payload));
		}
	}

	function addMessageListener(type, callback) {
		if(!messageListeners.hasOwnProperty(type)) messageListeners[type] = [];
		messageListeners[type].push(callback);
	}

	function isConnected() {
		return socket && socket.readyState === 1;
	}

	return {
		connect: connect,
		send: sendMessage,
		on: addMessageListener,
		connected: isConnected
	}
});

if (typeof module !== "undefined" && module.exports) {
    module.exports = socker;
}