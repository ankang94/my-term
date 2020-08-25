const pty = require('node-pty');

const DEVICE_HOST = '192.168.30.252';

let devices = {};

let exitHandle, readHandle;

let cols=80, rows=30;

exports.connectDev = function (code) {
    if (devices[code]) {
        return;
    } else {
        devices[code] = pty.spawn('telnet.exe', [DEVICE_HOST, code], {
            name: 'xterm-color',
            cols: cols,
            rows: rows,
            cwd: process.env.HOME,
            env: process.env
        });

        devices[code].on('exit', function () {
            delete devices[code];
            exitHandle && exitHandle(code);
        });

        devices[code].on('data', function (data) {
            readHandle && readHandle(code, data);
        });
    }
}

exports.registryEixt = function (handle) {
    exitHandle = handle;
}

exports.registryRead = function (handle) {
    readHandle = handle;
}

exports.resizeDev = function (cols, rows) {
    cols=cols;
    rows=rows;
}

exports.write = function (code, data) {
    devices[code] && devices[code].write(Buffer.from(data, 'base64').toString());
}

exports.kickout = function (code) {
    devices[code] && devices[code].kill();
}