export class WebSocket {
    socket: SocketIOClient.Socket;

    constructor() {
        let host = window.location.origin;
        console.log("WebSocket connecting to", host);

        this.socket = io.connect(host);

        this.socket.on('connect', () => {
            let sessionId = this.socket.io.engine.id;
            console.log("WebSocket connected with session id", sessionId);
            this.socket.emit('new_user', { id: sessionId });
        });
    }
}
