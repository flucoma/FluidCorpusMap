
import { resolve } from 'path';
import { server, map, lang } from 'supercolliderjs';
import * as fs from 'fs';

const context = {
  users: {},
  corpora: {}
};

async function loadBuffersList(fname, corpus, doneFunc, folder = null){
  let i = 0;
  let path = resolve(__dirname, fname);
  let lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(path)
  });
  let temp_fnames = {}
  lineReader.on('line', async function (line) {
    let key = folder==null? i:folder+"/"+i;
    console.log(folder);
    console.log(key);
    corpus.filenames[key] = line.trim();
    temp_fnames[key] = line.trim();
    i++;
  });
  let j = 0;

  lineReader.on('close', async function(){
    for(let f in temp_fnames){
      await context.server.readBuffer(temp_fnames[f]).then((buf) =>{
        let key = folder==null? j:folder+"/"+j;
        corpus.buffers[key] = buf;
        j++;
        if (j >= Object.keys(temp_fnames).length - 1){
          console.log("finished loading");
          doneFunc();
        }
      });
    }
  });
}

function isFlatDSFile(fname){
  console.log(isFlatDSFile);
  console.log(fname.substring(fname.length - 3, fname.length));
  return fname.substring(fname.length - 3, fname.length)==".ds"
}

async function loadBuffers(socket, data){
  let name = data.name;
  if (context.corpora[name]==undefined){
    context.corpora[name] = {};
    context.corpora[name].buffers = {};
    context.corpora[name].filenames = {};
    if(isFlatDSFile(data.indexFile)){
      loadBuffersList(data.indexFile, context.corpora[name], () => {socket.emit("buffers_loaded")});
    }
    else {
      let folders = fs.readdirSync(resolve(__dirname, data.indexFile));
      for(let f in folders){
        let folderName = folders[f];
        let indexFile = folderName + "/filenames.ds";
        loadBuffersList(name+"/"+indexFile, context.corpora[name], () => {
          if(f==folders.length-1){
            socket.emit("buffers_loaded")
          }
        }, folderName);
      }
    }
  } else {
    socket.emit("buffers_loaded");
  }
}

export function bootServer() {
  return server.boot({"numBuffers":50000, "memSize":4*8192, "port":9991}).then((s) => {
    context.server = s;
  });
};

function loadPlayer(socket, data){
  let corpus = context.corpora[data.corpusName];
  corpus.player = context.server.loadSynthDef(data.name, resolve(__dirname, data.fname))
  corpus.player.then(()=>socket.emit("player_loaded"));
}

function connect(socket) {
  console.log(`Connecting user ${socket.id}`);
  context.users[socket.id] = {synths:{}};
}

function disconnect(socket) {
  let user = context.users[socket.id];
  if (user) {
    if(user.synths){
      for (var s in user.synths) {
        user.synths[s].then((syn) => {syn.free()});
      }
    }
    delete context.users[socket.id];
    console.log(`Removing user ${socket.id}`);
  }
}

function noteOn(socket, data) {
  console.log('noteOn', data);
  let corpus = context.corpora[data.corpusName];
  let user = context.users[socket.id];
  if(user && user.synths){
    let synth = user.synths[data.touchId];
    if (synth){
      synth.then((s) => {console.log("freeing");s.free()});
    }
  }

  if(corpus&&corpus.buffers.hasOwnProperty(data.soundId)){
    let newSynth = context.server.synth(corpus.player, {
      bufnum: corpus.buffers[data.soundId].id
    });
    // Store the note
    context.users[socket.id].synths[data.touchId] = newSynth;
  }
}

function noteOff(socket, data) {
  console.log('noteOff', data);
  let corpus = context.corpora[data.corpusName];
  let user = context.users[socket.id];
  if(user && user.synths && data.soundId<corpus.buffers.length){
    let synth = user.synths[data.touchId];
    console.log(synth);
    if (synth){
      synth.then((s) => {console.log("freeing!");s.free()});
    }
    //delete  user.synths[data.touchId];
  }
}

function noteSlide(socket, data) {
  console.log('noteSlide', data);
  let corpus = context.corpora[data.corpusName];
  let user = context.users[socket.id];
  if(user && user.synths){
    let synth = user.synths[data.touchId];
    console.log(synth);
    if (synth){
      synth.then((syn) => {
        syn.set({bufnum: corpus.buffers[data.soundId].id});
      });
    }
  }
}

export const socketEventHandlers = {
  connect,
  disconnect,
  noteOn,
  noteOff,
  noteSlide,
  loadBuffers,
  loadPlayer
};
