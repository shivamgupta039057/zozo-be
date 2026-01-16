
/**
 * configuration of sockets
 * Set up socket.io connection
 *
 * @param {string} io the socket server instance
 */
module.exports = (io) => {

    // let stockData = await stockModel.find()
    io.on('connection', async (socket) => {

        console.log('Client connected:', socket.id);

        socket.on('joinRoom', (data) => {
            console.log("joinRoom", data.chatId)
            socket.join(`${data.chatId}`)
        });

        // Handle leaving chat room
        socket.on('leaveRoom', (data) => {
            console.log("leaveRoom", data.chatId)
            socket.leave(`${data.chatId}`)
        });

        // Handle user disconnection
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};


