var websocket = require('ws').Server;
var SEND = require('./send');
var room = require('./room');
var PORT = 3000; // 监听的端口号

var wss = new websocket({ port: PORT }),
  SEED_NUM = 0,
  GEN_ID = function () { // 生成一个唯一标识给每一个连接，应用中可以直接使用 user_id
    SEED_NUM++;
    return SEED_NUM;
  },
  getRoom = function (id) { // 获取一个房间对象
    var _roomId = id;
    var _room = null;
    if (_roomId) {
      _room = room.get(_roomId);
    }
    return _room;
  };
console.log('simpleChatRoom start up, listen: ' + PORT);

// 进入一个房间
wss.enterRoom = function (w, msg) { 
  var _room = getRoom(msg.room_id)

  if (_room) {
    _room.enter(w, msg);
  } else {
    // 不存在房间
    SEND(w, { t: -1, err: 100, result: 'room not exist' });
  }
}

// 离开房间
wss.exitRoom = function (w) {
  var _room = getRoom(w.room_id);

  if (_room) {
    _room.exit(w);
  }
  // 响应客户端
  SEND(w, { t: -11, from_room: w.room_id });

}

// 发送聊天消息
wss.sendMsg = function(w,msg) {
  var _room = getRoom(w.room_id);
  if(_room) {
    _room.broadcastMsg(w,msg);
  }
}

// 处理客户端发过来的消息，通常情况下：客户端发来 t = 1 的消息，服务端响应 t = -1 的消息，依此类推
var ws_on_message = function (msg) {
  console.log('recved a message: ' + msg);

  msg = JSON.parse(msg);

  switch (msg.t) {
    case 1: // 进入房间
      wss.enterRoom(this, msg);
      break;
    case 2: // 发送消息
      wss.sendMsg(this, msg);
      break;
    case 11: // 离开房间
      wss.exitRoom(this);
      break;

  }



}

// 连接关闭
var ws_on_close = function () {
  console.log('ws close.' + this.wid);
  // 退出房间
  var _room = getRoom(this.room_id);
  if (_room) {
    _room.exit(this);
  }
};

// 遇到错误
var ws_on_error = function () {
  console.log('ws error.' + this.wid);
  var _room = getRoom(this.room_id);
  if (_room) {
    _room.exit(this);
  }
}

// 建立连接
wss.on('connection', function (ws) {
  console.log('ws conn.');
  ws.wid = GEN_ID();
  ws.on('message', ws_on_message);
  ws.on('cloase', ws_on_close);
  ws.on('error', ws_on_error);
  SEND(ws, { t: 0, wid: ws.wid });
});
