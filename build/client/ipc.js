const RawIPC = require('node-ipc').IPC;

const port = 10101;
const ipcid = 'H3TERM';

let queuemsg = [];
let messaging = [];

let destroyHandle;

function loginCheck(user, passwd) {
    let handle;
    if (ipc) {
        ipc.of[ipcid].emit('loginreq', { user, passwd });
        return new Promise(function (resolve, reject) {
            handle = function (type, data) {
                if (type === handle.type) resolve(data);
            }
            handle.type = 'login';
            queuemsg.push(handle);
            setTimeout(() => {
                reject('timeout');
            }, 5000);
        }).finally(() => {
            queuemsg = queuemsg.filter(x => x !== handle);
        });
    } else {
        return Promise.reject('disconnect');
    }
}

function killDevByCode(code) {
    let handle;
    if (ipc) {
        ipc.of[ipcid].emit('kickoutreq', { code });
        return new Promise(function (resolve, reject) {
            handle = function (type, data) {
                if (type === handle.type) resolve(data);
            }
            handle.type = 'kickout';
            queuemsg.push(handle);
            setTimeout(() => {
                reject('timeout');
            }, 5000);
        }).finally(() => {
            queuemsg = queuemsg.filter(x => x !== handle);
        });
    } else {
        return Promise.reject('disconnect');
    }
}

let ipc;
exports.initConnect = function (ip) {
    ipc = new RawIPC();
    ipc.config.silent = true;
    ipc.config.maxRetries = 3;
    ipc.connectToNet(ipcid, ip, port, () => {
        ipc.of[ipcid].on(
            'connect',
            () => {}
        );
        ipc.of[ipcid].on('devlist', list => {
            messaging.forEach(handle => handle({
                type: 0,
                data: list
            }));
        }),
        ipc.of[ipcid].on('kickoutreq', (data) => {
            messaging.forEach(handle => handle({
                type: 1,
                data: data.code
            }));
            ipc && ipc.of[ipcid].emit('kickoutres');
        });
        ipc.of[ipcid].on('loginres', result => {
            queuemsg.forEach(handle => handle(handle.type, result));
        });
        ipc.of[ipcid].on('kickoutres', result => {
            queuemsg.forEach(handle => handle(handle.type, result));
        });
        ipc.of[ipcid].on(
            'destroy',
            () => {
                ipc = null;
                destroyHandle && destroyHandle();
            }
        )
    });
}

exports.destroy = function () {
    if (ipc) {
        return new Promise(function (resolve, reject) {
            ipc.disconnect(ipcid);
            destroyHandle = function () {
                resolve(destroyHandle=null);
            }
            setTimeout(() => {
                reject('timeout');
            }, 3000);
        });
    }
    return Promise.resolve();
}

exports.check = function (user, passwd) {
    return loginCheck(user, passwd);
}

exports.usedev = function (code) {
    ipc && ipc.of[ipcid].emit('usedev', {
        code
    });
}

exports.disdev = function (code) {
    ipc && ipc.of[ipcid].emit('disdev', {
        code
    });
}

exports.leave = function () {
    ipc && ipc.of[ipcid].emit('leave');
}

exports.join = function () {
    ipc && ipc.of[ipcid].emit('join');
}

exports.send = function (type, data) {
    ipc && ipc.of[ipcid].emit(type, data);
}

exports.kickout = function (devcode) {
    return killDevByCode(devcode);
}

exports.registry = function (handle) {
    messaging.push(handle);
}

Object.defineProperties(module.exports, {
    'state': {
        get: function () {
            return !!ipc;
        }
    },
    'DEVICES': {
        get: function () {
            return 0;
        }
    },
    'KICKOUT': {
        get: function () {
            return 1;
        }
    }
});