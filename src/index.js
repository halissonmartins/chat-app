const path = require('path')
const http = require('http');
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {
    generateMessage,
    generateLocationMessage,
} = require('./utils/messages')

const {
    addUser, 
    removeUser, 
    getUser, 
    getUsersInRoom
} = require('./utils/users')

//Define paths form Express config
const publicDirectoryPath = path.join(__dirname, '../public')

const app = express()
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000

//Setup static directory for static files
app.use(express.static(publicDirectoryPath))

// let count = 0

io.on('connection', (socket) => {
    console.log('New websocket connection')

    socket.on('join', (options, callback) => {

        const {user, error} = addUser({id: socket.id, ...options})
        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', `Welcome ${user.username}!`))
        socket.broadcast.to(user.room).emit('message', 
            generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {

        const filter = new Filter()

        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!');
        }

        const user = getUser(socket.id);
        if(!user){
            return callback('User not found!');
        }
        
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback()
    })

    socket.on('sendLocation', (coordinates, callback) => {
        
        const user = getUser(socket.id);
        if(!user){
            return callback('User not found!');
        }

        io.to(user.room).emit(
            'location-message', 
            generateLocationMessage(user.username, coordinates));
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    // socket.emit('countUpdated', count)

    // socket.on('increment', () => {
    //     count++
    //     //socket.emit('countUpdated', count)
    //     io.emit('countUpdated', count)
    // })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})