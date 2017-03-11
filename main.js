const memdb = require('memdb');
const randomBytes = require('randombytes');

const Chat = require('./index');

const nym = randomBytes(3).toString('hex');
const chat = new Chat(nym, memdb());

chat.on('join', function (channel) {
  console.log('you joined channel', channel);
});

chat.on('peer', function (peer, id) {
  console.log('a peer joined the channel', id, peer);
});

chat.on('disconnect', function (peer, id) {
  console.log('a peer left the channel', id, peer);
});

chat.on('leave', function (channel) {
  console.log('you left channel', channel);
  removeChildren(chats);
});

chat.on('say', function (channel, row) {
  console.log('channel received a new chat', channel, row);
  appendChat(row.value.message);
});

chat.join('default');

// chat

const content = document.getElementById('content');

const join = document.createElement('button');
join.id = 'join';
join.innerHTML = 'join';
content.appendChild(join);
join.addEventListener('click', () => {
  chat.join('default');
});

const leave = document.createElement('button');
leave.id = 'leave';
leave.innerHTML = 'leave';
content.appendChild(leave);
leave.addEventListener('click', () => {
  chat.leave('default')
});

const chats = document.createElement('div');
chats.id = 'chats';
content.appendChild(chats);

const chatForm = document.createElement('form');
chatForm.id = 'chat-form';
chatForm.name = 'chat-form';
content.appendChild(chatForm);

const chatMessage = document.createElement('input');
chatMessage.id = 'chat-message';
chatForm.appendChild(chatMessage);

const chatSubmit = document.createElement('button');
chatSubmit.id = 'chat-submit';
chatSubmit.innerHTML = 'send';
chatSubmit.type = 'submit';
chatForm.appendChild(chatSubmit);

chatForm.addEventListener('submit', say);

function say(e) {
  e.preventDefault();

  const message = chatMessage.value;
  chatMessage.value = '';
  chat.say('default', message);
}

function appendChat(message) {
  const chat = document.createElement('div');
  chat.innerHTML = message;
  chats.appendChild(chat);
}

function removeChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}
