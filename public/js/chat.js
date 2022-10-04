const socket = io();

// Elements
const $messageForm = document.getElementById('send-message-form');
const $messageInput = document.getElementById('chat-message-input');
const $locationBtn = document.getElementById('send-location-btn');
const $sendBtn = document.getElementById('send-message-btn');
const $messages = document.getElementById('messages');
const $sidebar = document.getElementById('sidebar');

// Templates
const $messageTemplate = document.getElementById('message-template').innerHTML;
const $locationTemplate =
  document.getElementById('location-template').innerHTML;
const $sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

// helper function
function clearMessage(input) {
  input.value = '';
  input.focus();
}

// helper function
function buttonToggler(button) {
  if (button.hasAttribute('disabled')) {
    return button.removeAttribute('disabled');
  }

  button.setAttribute('disabled', 'disabled');
}

// helper function
const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // get height of the new message
  // offsetHeight does not account for margin
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// console.log(username);

socket.on('locationMessage', ({ username, url }) => {
  const html = Mustache.render($locationTemplate, {
    username,
    locationMessage: url.location,
    timestamp: moment(url.timestamp).format('kk:mm:ss'),
  });

  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

// listening to a variety of messages which is why a generic name of message is chosen
socket.on('message', (chatMessage) => {
  const html = Mustache.render($messageTemplate, {
    username: chatMessage.username,
    timestamp: moment(chatMessage.timestamp).format('kk:mm:ss'),
    chatMessage: chatMessage.text,
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

$messageForm.addEventListener('submit', (event) => {
  event.preventDefault();

  buttonToggler($sendBtn);

  const chatMessage = $messageInput.value;
  socket.emit('sendMessage', chatMessage, (error) => {
    // send button should re-enabled when aknowledgement received from server
    buttonToggler($sendBtn);
    clearMessage($messageInput);
    if (error) {
      return console.log(error);
    }

    console.log('Message delivered!');
  });
});

$locationBtn.addEventListener('click', () => {
  buttonToggler($locationBtn);
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser');
  }

  navigator.geolocation.getCurrentPosition((position) => {
    // console.log(position);
    const sendLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    socket.emit('sendLocation', sendLocation, (ack) => {
      console.log(ack);
      buttonToggler($locationBtn);
    });
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = './';
  }
});

socket.on('roomData', ({ room, users }) => {
  // console.log(room, users);
  const html = Mustache.render($sidebarTemplate, {
    room,
    users,
  });

  $sidebar.innerHTML = html;
});
