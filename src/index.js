const express = require('express');
const path = require('path'); // core node module
const http = require('http'); // core node module
const socketio = require('socket.io');
const Filter = require('bad-words');
const {
  generateMessage,
  generateLocationMessage,
} = require('./utils/messages');
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users');

const app = express();

// creates a new web server
// express library does this behind the scenes
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// socket.io instance
// io is a common name for instance
// socket.io expects it to be called with raw http server
const io = socketio(server);

app.use(express.json());

const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

// need to load it on server and client side
io.on('connection', (socket) => {
  socket.on('sendMessage', (chatMessage, callback) => {
    const user = getUser(socket.id);

    // filtering bad words
    const filter = new Filter({
      placeHolder: 'broccoleh',
      list: [
        'toot',
        'bunnistein',
        'bunnystein',
        'kewl',
        'supa',
        'chorizus',
        'linguiny',
        'linguineh',
        'linguini',
        'pizza',
      ],
      replaceRegex: /(pizza|toot|lingui[n|y|e*h|i]*|chorizus|kewl)/gi,
    });

    // sending to every client
    io.to(user.room).emit(
      'message',
      generateMessage(
        user.username,
        filter.clean(chatMessage.replaceAll(/bunnicula/gi, 'GOD'))
      )
    );
    callback();
  });

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id);
    socket.broadcast.to(user.room).emit('locationMessage', {
      username: user.username,
      url: generateLocationMessage(
        `https://google.com/maps?q=${location.latitude},${location.longitude}`
      ),
    });

    callback('Location has been shared successfully!');
  });

  // interestingly does not use io.on
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      // here we do not need to use broadcast because this client cannot receive their own message as they have left the chat
      io.to(user.room).emit(
        'message',
        generateMessage(
          'Admin',
          `${user.username} has left '${user.room} chat room'`
        )
      );
    }

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  });

  // JOIN
  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }
    // only emitting events for users in the specified room
    socket.join(user.room);

    socket.emit('message', generateMessage('Admin', 'Welcome!'));

    // broadcasting emits messages to everyone except the person with the current particular socket
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage('Admin', `${user.username} has joined!`)
      );

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });
});

server.listen(port, () => {
  console.log('Server is up on port ' + port);
});
