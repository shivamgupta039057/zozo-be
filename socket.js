const http = require('http');
const socketIo = require('socket.io');
const devConfig = require('./src/config/dev.config');
require('dotenv').config();
const socketHandler = require('./src/app/sockets/socket');
const { setIO } = require('./src/app/sockets/socketIntance');
const LOG_ID = 'server/socket';
const socketPort = devConfig.SOCKET_PORT || 3131;


console.log("socketPortsocketPort" , socketPort);

// const {initDB}=require('./src/pgModels/index')
const server = http.createServer();
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});

// initDB();

// Import and initialize your Socket.IO handlers
// require('./src/app/sockets/socket')(io);
// register events
socketHandler(io);

// save io globally
setIO(io);

server.listen(socketPort, () => {
    console.log(`Socket.IO server listening on port ${socketPort}`)
});

// Export both server and io instance so io can be accessed from other modules
module.exports = server;
server.io = io; // Attach io to server object for easier access