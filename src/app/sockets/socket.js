
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


        // 🔹 USER ROOM (NEW - for alerts)
        socket.on("joinUser", ({userId}) => {
            console.log(userId)
            socket.join(`user_${userId}`);
            console.log(`User joined alert room: user_${userId}`);
        });

        // Handle user disconnection
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};


