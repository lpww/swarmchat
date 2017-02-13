const createSwarm = require('webrtc-swarm');
const signalhub = require('signalhub');
const hyperlog = require('hyperlog');
const memdb = require('memdb');

const log = hyperlog(memdb());

const hub = signalhub('swarm-example', ['localhost:8080']);
const swarm = createSwarm(hub);

swarm.on('peer', (peer, id) => {
  console.log('connected to a new peer:', id);
  console.log('total peers:', swarm.peers.length);
  const latest = log.replicate({ live: true });
  peer.pipe(latest).pipe(peer);
});


// chat

const content = document.createElement('div');
content.id = 'content';
document.body.appendChild(content);

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
chatSubmit.type = 'submit';
chatForm.appendChild(chatSubmit);


chatForm.addEventListener('submit', chat);

function chat(e) {
  e.preventDefault();

  const message = chatMessage.value;
  chatMessage.value = '';
  log.append(message);
}


log.createReadStream({ live: true }).on('data', function (data) {
  appendChat(data.value.toString());
});

function appendChat(message) {
  const chat = document.createElement('div');
  chat.innerHTML = message;
  chats.appendChild(chat);
}

