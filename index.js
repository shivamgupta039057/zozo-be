const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
require('dotenv').config();
const http = require('http');
const devConfig = require('./src/config/dev.config');
const { connectPostgres,sequelize } = require('./src/config/postgres.config');
const {initDB}=require('./src/pgModels/index')
global.c = console.log.bind(console);
const seed = require("./src/seed/seedData");
const socketIo = require('socket.io');
const socketHandler = require('./src/app/sockets/socket');
const { setIO } = require('./src/app/sockets/socketIntance');
app.use(cors());
// connectPostgres();
initDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.use((req, res, next) => {
    console.log(req.method, req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('body :', req.body, 'query :', req.query);
    req.date = new Date();
    next();
});
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// register socket events
socketHandler(io);

// save globally
setIO(io);
require('./src/app/routes')(app);
app.use((req, res) => res.status(404).json({ status: false, message: "Route Not Found", data: [] }));
app.use((err, req, res, next) => {
    console.log("request error: ", err)
    return res.status(400).json({ status: false, message: "Error In Request", data: [] })
})

const PORT = devConfig.PORT || 6060;
require('./cron');


server.listen(PORT, async () => {
    console.log(`Server is running on ${PORT}`);

    // try {
    //     const url = await ngrok.connect(PORT);
    //     console.log(`Ngrok tunnel: ${url}`);
    // } catch (error) {
    //     console.error("Error starting ngrok:", error);
    // }
});