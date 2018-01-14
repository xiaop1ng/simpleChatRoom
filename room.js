var SEND = require('./send');

// id: NOT NULL, 聊天室编号
// name: NULL, 聊天室名称
var room = function (id, name) {
    if (id) {
        this.id = id;
    } else {
        this.id = 0; // 默认聊天室
    }
    this.name = name;
    this.users = {};  // 用户列表(k-v)
    this._users = []; // 用户列表(array) 
};

// 保存所有的房间信息
room.ROOMs = {};

// 获取一个房间
room.get = function (roomId) {
    if(!roomId){
        roomId = 0;
    }
    var _room = room.ROOMs[roomId];
    
    if (!_room) {
        _room = new room(roomId, '聊天室_' + roomId);
        room.ROOMs[roomId] = _room;
    }
    return _room;
};


// 取得房间内指定的用户，如果该用户不存在于当前房间中，则返回 null
room.prototype.getUser = function (wid) {
    return this.users[wid];
};

// 用户进入房间
room.prototype.enter = function (w, msg) {
    if (!this.users[w.wid]) {
        var _to_other_msg = {// 通知房间内的其他用户有新人进入的消息
            t: -10001,
            err: 0,
            data: {
                wid: w.wid,
                n: msg.n,
            }
        };
        var _roomData = {
            id: this.id,
            name: this.name,
            users: this._users.map(function (T) {
                // 通知房间内的其他用户有新人进入
                SEND(T, _to_other_msg);
                return {
                    wid: T.wid,
                    n: T.n,
                };
            })
        };
        w.n = msg.n;
        w.room_id = this.id;
        this.users[w.wid] = w;
        this._users.push(w);
        SEND(w, { t: -1, err: 0, wid: w.wid, data: _roomData }, msg);
    } else {
        SEND(w, { t: -1, err: 101 }, msg); // 已在当前房间中
    }
};

// 广播消息
room.prototype.broadcastMsg = function(w,msg) {
    var _user = this.getUser(w.wid);
    if(_user) {
        var _to_other_msg = { // 广播给聊天室里的其他用户
            t : -2,
            err : 0,
            data : {
                wid: _user.wid,
                username: _user.n,
                message: msg.body
            }
        };
        this._users.filter(function (T){
            var flag = T.wid != w.wid;
            if(flag) {
                SEND(T, _to_other_msg);
            }
        });
    }
}

// 退出房间
room.prototype.exit = function (w) {
    delete this.users[w.wid];

    this._users = this._users.filter(function (T) {
        var bl = T != w;
        if (bl) {
            // 将用户离开的消息发送给房间内的其他用户
            SEND(T, { t: -11000, wid: w.wid, n:w.n });
        }
        return bl;
    });
    delete w.room_id;
};

module.exports = room;