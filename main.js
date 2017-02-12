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

log.createReadStream({ live: true }).on('data', console.log);
