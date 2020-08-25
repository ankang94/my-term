const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const uuid = require('uuid');
const log4js = require('log4js');

const host = '0.0.0.0';
const port = 10101;

let config, users;
let devicepool = {};
let queuemsg = [];

log4js.configure({
    categories: {
        default: { appenders: ['console', 'h3term'], level: 'info' }
    },
    appenders: {
        console: { type: 'console' },
        h3term: {
            "type": "dateFile",
            "daysToKeep": 7,
            "maxLogSize": 5242880,
            "alwaysIncludePattern": true,
            "pattern": "yyyyMMdd.log",
            "filename": "/var/h3term/telnet-ac-"
        }
    }
});

const logger = log4js.getLogger();

const ipc = new Proxy(require('node-ipc'), {
    get(target, property, receiver) {
        if (property === 'server') {
            return new Proxy(target[property], {
                set(target, key, value, receiver) {
                    if (key === 'server' && value) {
                        process.nextTick(function () {
                            value.__write__ = value.write;
                            value.write = function () {
                                value.user && value.__write__.apply(value, arguments);
                            }
                        });
                    }
                    return Reflect.set(target, key, value, receiver);
                }
            });
        } else {
            return Reflect.get(target, property, receiver);
        }
    }
});

// 3001: 5540H
if (fs.existsSync(path.join(__dirname, 'config.yaml'))) {
    let file = fs.readFileSync(path.join(__dirname, 'config.yaml'), 'utf8');
    try {
        users = yaml.parse(file).user;
        config = yaml.parse(file).device;
    } catch (error) {
        logger.warn(`parse config yaml faild, ${error}`);
    }
}

Object.keys(config).forEach(item => {
    devicepool[item] = {
        name: config[item],
        owner: null
    };
});

ipc.config.silent = true;
ipc.config.id = 'H3TERM';

function killDevPid(code) {
    let handle;
    let _token = uuid.v4();
    ipc.server.emit(devicepool[code].owner, 'kickoutreq', {
        code
    });
    return new Promise(function (resolve, reject) {
        handle = function (token) {
            if (_token === token) resolve();
        }
        handle.token = _token;
        queuemsg.push(handle);
        setTimeout(() => {
            reject('timeout');
        }, 5000);
    }).finally(() => {
        queuemsg = queuemsg.filter(x => x !== handle);
    });
}

function verifyPasswd(src, dst) {
    return src && dst && src.toUpperCase() === dst.toUpperCase();
}

ipc.serveNet(host, port, function () {
    ipc.server.on(
        'loginreq',
        (data, socket) => {
            if (/\d{5}/.test(data.user) && verifyPasswd(users[data.user], data.passwd)) {
                socket.user = data.user;
                ipc.server.emit(socket, 'loginres', 0);
            } else {
                ipc.server.emit(socket, 'loginres', 1);
            }
        }
    );
    ipc.server.on(
        'join',
        (data, socket) => {
            ipc.server.emit(socket, 'devlist', Object.keys(devicepool).map(key => ({
                code: key,
                name: devicepool[key].name,
                user: devicepool[key].owner && devicepool[key].owner.user
            })));
        }
    );
    ipc.server.on(
        'usedev',
        (data, socket) => {
            if (socket.user && !devicepool[data.code].owner) {
                devicepool[data.code].owner = socket;
                ipc.server.broadcast('devlist', Object.keys(devicepool).map(key => ({
                    code: key,
                    name: devicepool[key].name,
                    user: devicepool[key].owner && devicepool[key].owner.user
                })));
            }
        }
    );
    ipc.server.on(
        'disdev',
        (data, socket) => {
            if (devicepool[data.code].owner === socket) {
                delete devicepool[data.code].owner;
                ipc.server.broadcast('devlist', Object.keys(devicepool).map(key => ({
                    code: key,
                    name: devicepool[key].name,
                    user: devicepool[key].owner && devicepool[key].owner.user
                })));
            }
        }
    );
    ipc.server.on(
        'leave',
        (data, socket) => {
            let flag = false;
            delete socket.user;
            for (const [key, value] of Object.entries(devicepool)) {
                if (value.owner === socket) {
                    devicepool[key].owner = null;
                    flag = true;
                }
            }
            if (flag) {
                ipc.server.broadcast('devlist', Object.keys(devicepool).map(key => ({
                    code: key,
                    name: devicepool[key].name,
                    user: devicepool[key].owner && devicepool[key].owner.user
                })));
            }
        }
    );
    ipc.server.on(
        'kickoutreq',
        (data, socket) => {
            if (devicepool[data.code].owner) {
                killDevPid(data.code).then(() => {
                    logger.warn(`${data.name} kick out ${devicepool[data.code].user} in order to use ${data.device}`);
                    ipc.server.emit(socket, 'kickoutres', true);
                    devicepool[data.code].owner = null;
                    ipc.server.broadcast('devlist', Object.keys(devicepool).map(key => ({
                        code: key,
                        name: devicepool[key].name,
                        user: devicepool[key].owner && devicepool[key].owner.user
                    })));
                }, () => {
                    ipc.server.emit(socket, 'kickoutres', false);
                });
            } else {
                ipc.server.emit(socket, 'kickoutres', true);
            }
        }
    );
    ipc.server.on('kickoutres', function (data, socket) {
        queuemsg.forEach(handle => handle(handle.token));
    });
    ipc.server.on(
        'socket.disconnected',
        function(socket, destroyedSocketID) {
            let flag = false;
            if (socket.user) {
                for (const [key, value] of Object.entries(devicepool)) {
                    if (value.owner === socket) {
                        devicepool[key].owner = null;
                        flag = true;
                    }
                }
            }
            if (flag) {
                ipc.server.broadcast('devlist', Object.keys(devicepool).map(key => ({
                    code: key,
                    name: devicepool[key].name,
                    user: devicepool[key].owner && devicepool[key].owner.user
                })));
            }
        }
    );
});

ipc.server.start();
logger.info('h3term manager start success.');
