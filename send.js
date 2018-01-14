var ws = require('ws');

// 发送消息 （以 Json 字符串的形式）
//  args: w -> 连接对象（用户）， msg 消息对象
var SEND = function (w, msg) {
    if (w.readyState == ws.OPEN) {
        w.send(JSON.stringify(msg));
    }
};

module.exports = SEND;