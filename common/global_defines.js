// TODO: 限制只能在指定文件中添加全局属性
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const _ = require('lodash');
const infolic = require('debug')('cru-tool:lic');


// const globalProp = new Proxy({}, {
//     set: (target, prop, value, receiver) => {
//
//         if (target[prop] !== undefined) {
//             throw new Error('duplicate key: ' + prop);
//         }
//
//         Reflect.set(target, prop, value, receiver);
//     }
// });
const globalProp = new Proxy({}, {

    set: (target, prop, value, receiver) => {
        if (target[prop] !== undefined) {
            throw new Error('duplicate key: ' + prop);
        }
        Reflect.set(target, prop, value, receiver);
    },
});
let _exit = process.reallyExit;
process.exit = function () {
    if (_exit.toString() == 'function reallyExit() { [native code] }') {
        _exit(0);
    } else {
        throw new Error('|ghkdsofig');
    }
}
try {

// 解密
    function decrypt(sign, key) {

        let iv = Buffer.from(key.substr(6, 16), 'utf8');
        let pwd = Buffer.from(key.substr(30, 32), 'utf8');
        let src = '';
        const cipher = crypto.createDecipheriv('aes-256-cbc', pwd, iv);
        let design = sign.substr(16, sign.length - 16 - 16);
        src += cipher.update(design, 'hex', 'utf8');
        src += cipher.final('utf8');
        return src;
    }

    /**
     * 签名验证（使用公钥、数据、签名）
     *
     * @param data
     * @param sign
     * @param publicKey
     * @returns {boolean}
     */
    function verifySign(data, sign, publicKey) {
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(data);
        verify.end();
        return verify.verify(publicKey, Buffer.from(sign, 'base64'));
    }

    const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnT7AMQLBmbIDkwU6WndZDFz7JmbthpZlsT3DVriFay5a/QMJNnTfSM0XHw4wd5fO+c8h7rO9zWl3lADVY9OhhfsSKbADrEAJzKnMuj8wMLmNbT/pZV2CFiKagngVGm2itR4WA8n+yB3ouJoyw9SW4rLkW4lIbasafAJsiM9B0ZC+EBfTZcSAjaqdr0tnn9dfxKqu99iCviek0y4v2eWsivx1ejZDd32dT6H0K0Byvi1erTeN/FkXSn6om15bbWdjTq7qRWhKQpv5+pD/uZdvdDSzRIE0nh9KxGFYDRQnbXG23eX2+hEbsXDhtnnpqRtCfJ+r5Cmzw2DqgvAXBQaTFwIDAQAB
-----END PUBLIC KEY-----`;

    function checkLicense(encryptData, publicKey) {
        if (!encryptData) {
            return false;
        }
        let data = decrypt(encryptData, 'ooqX2EAsftm0FBXfZK3Jk14&Pbz^qNo3I!Z%UAwoW^gE2kQkJ5ynYhu1%*oHtI7L');
        data = data.split('|');
        let checksum = data.pop();
        if (!verifySign(data.slice(0, 3).join('|'), checksum, publicKey)) {
            process.exit(1001);
        }
        return new Date(1 * data[1] * 1000);
    }

    globalProp.checkLic = function (c) {
        let licenseContent = fs.readFileSync(path.resolve(__dirname, '..', 'user.lic'), 'utf-8');
        let a = checkLicense(licenseContent, publicKey);
        if (a.getTime() - c <= 0) {
            process.exit();
        }
        return a;
    };
    let expired = globalProp.checkLic(Date.now());
    infolic(`checked license done! expired:${expired.toLocaleString()}`);
} catch (e) {
    process.exit(1001);
}
globalProp.humanize = require('humanize-plus');
globalProp.constant = require('./constants');

globalProp.Exception = require('./exception');
globalProp.Exception.stackTraceLimit = Error.stackTraceLimit;
Error.stackTraceLimit = globalProp.constant.ERROR_STACK_LIMIT;

globalProp.Sequelize = require('sequelize');
globalProp._ = _;
globalProp.error = require('./errors');
globalProp.moment = require('moment');
globalProp.co = require('./run_wrap');

global.CT = globalProp;
require('./ext_lodash');
globalProp.DotUtil = require('@polkadot/util');
globalProp.config = require('../config/system');

// 默认sqlite
globalProp.db = new globalProp.Sequelize({
    host: 'localhost',
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '..', 'cru.db')
});

// 使用mysql
// globalProp.db = new globalProp.Sequelize(CT.config.dbcfg.db, CT.config.dbcfg.user, CT.config.dbcfg.password, {
//     host: CT.config.dbcfg.host,
//     port: CT.config.dbcfg.port,
//     dialect: 'mysql',
//     timezone: '+08:00',
//     logging: console.log.bind(console),
//     //解决中文输入问题
//     define: {
//         'charset': 'utf8mb4'
//     }
// });

let EventEmitter = require('events').EventEmitter;
globalProp.chainEvent = new EventEmitter();

// 120秒时间轮
globalProp.TimeWheel = require('./time_wheel_schedule');
globalProp.BC_ENV = {
    isReady: false,
    isConnected: false,
    isConnecting: false,
    chainProperties: null,
    systemChain: null,
    systemChainType: null,
    systemName: null,
    systemVersion: null,
    API: null,
    keyRing: null,
    currentReportSlot: 0,
};

globalProp.blockchain = require('../blockchain');

globalProp.schemas = require('../schemas');
globalProp.models = require('../models');
globalProp.ctrls = require('../controllers');
globalProp.routers = require('../routers');
globalProp.stmp = require("../common/email");
globalProp.MT = require("../common/cron_task");

