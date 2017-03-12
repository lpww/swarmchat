const EventEmitter = require('events').EventEmitter;
const hyperlog = require('hyperlog');
const sub = require('subleveldown');
const shasum = require('shasum');
const signalhub = require('signalhub');
const wswarm = require('webrtc-swarm');
const debounce = require('lodash.debounce');

class Chat extends EventEmitter {

  constructor(nym, db) {

    super();
    this.db = db;
    this.logs = {};
    this.swarms = {};
    this.peers = {};
    this.onpeer = {};
    this.ondisconnect = {};
    this.onclose = {};
    this.nym = nym;
    // this.trackers = ['https://swarmcast-signalhub.herokuapp.com/'];
    this.trackers = ['localhost:8080'];
  }

  join(channel) {

    const { db, logs, onclose, ondisconnect, onpeer, peers, swarms, trackers } = this;

    if (swarms.hasOwnProperty(channel)) {
      console.log('you are already in the channel ', channel);
      return;
    }

    logs[channel] = hyperlog(sub(db, channel), { valueEncoding: 'json' });
    logs[channel].createReadStream({ live: true }).on('data', row => {
      this.emit('say', channel, row);
    });

    this.emit('join', channel);

    const hub = signalhub('swarmcast.' + channel, trackers);
    const swarm = wswarm(hub);
    swarms[channel] = swarm;

    peers[channel] = {};

    onpeer[channel] = (peer, id) => {
      this.emit('peer', peer, id);
      peers[channel][id] = peer;
      peer.pipe(logs[channel].replicate({ live: true })).pipe(peer);
    };

    ondisconnect[channel] = (peer, id) => {
      if (peers[channel][id]) {
        this.emit('disconnect', peer, id);
        delete peers[channel][id];
      }
    };

    swarm.on('peer', onpeer[channel]);
    swarm.on('disconnect', ondisconnect[channel]);
  }

  leave(channel) {

    const { logs, onclose, ondisconnect, onpeer, peers, swarms } = this;

    if (!swarms.hasOwnProperty(channel)) {
      console.log('you are not in this channel');
      return;
    }

    delete logs[channel];

    swarms[channel].removeListener('peer', onpeer[channel]);
    swarms[channel].removeListener('disconnect', ondisconnect[channel]);
    delete onpeer[channel];
    delete ondisconnect[channel];

    Object.keys(peers[channel]).forEach(id => peers[channel][id].destroy());
    delete peers[channel];

    swarms[channel].close();
    delete swarms[channel];

    this.emit('leave', channel);
  }

  say(channel, message) {

    const { logs, nym } = this;

    if (!logs.hasOwnProperty(channel)) {
      console.log('you need to join the channel first');
      return;
    }

    const data = {
      time: Date.now(),
      who: nym,
      message: message
    };

    logs[channel].append(data);
  }
}

module.exports = Chat;