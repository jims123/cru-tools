const crypto = require('crypto');
const promise = require('bluebird');
const moment = require('moment');
const {stringToU8a, u8aToHex, hexToU8a} = require('@polkadot/util');
const {
    mnemonicGenerate,
    // mnemonicToMiniSecret,
    mnemonicValidate,
    // naclKeypairFromSeed
} = require('@polkadot/util-crypto');
const request = require('request');


const MNEMONIC_LENGTH = CT.constant.MNEMONIC_LENGTH;


Date.prototype.format = function format(fmt, zone) {
    return moment(this).utcOffset(zone || "+08:00").format(fmt);
};

Number.prototype.toCRU = function toPayStatus() {
    return Math.floor(this.valueOf() / Math.pow(10, 12));
};

String.prototype.toAddr = function toAddr(startTrimLength, endTrimLength) {
    let v = this.valueOf();
    if (v.length <= startTrimLength + endTrimLength) {
        return v;
    }
    return `${v.substr(0, startTrimLength)}...${v.substr(v.length - endTrimLength, endTrimLength)}`;
};
Number.prototype.toTimeSpan = function toTimeSpan() {
    const minutes = 60;
    const hours = minutes * 60;
    const days = hours * 24;
    let v = this.valueOf();
    let isNeg = v < 0;
    v = Math.abs(v);
    let day = Math.floor(v / days);
    let hour = Math.floor(v % days / hours);
    let minute = Math.floor(v % hours / minutes);
    let second = Math.floor(v % minutes);
    return `${isNeg ? '-' : ''}${day ? day + '天' : ''}${hour ? hour + '时' : ''}${minute ? minute + '分' : ''}${second ? second + '秒' : ''}`;
};
Number.prototype.toDate = function toDate(fmt, zone) {
    if (this.valueOf() <= 0) {
        return '';
    }
    return moment(this.valueOf() * 1000).utcOffset(zone || "+08:00").format(fmt);
};
String.prototype.toAccountSource = function () {
    let t = this.valueOf();
    let friendlyType = '';
    switch (t) {
        case CT.constant.ACCOUNT_SOURCE.IMPORT:
            friendlyType = '导入';
            break;
        case CT.constant.ACCOUNT_SOURCE.BATCH:
            friendlyType = '批量创建';
            break;
    }
    return friendlyType;
};
String.prototype.toAccountType = function () {
    let t = this.valueOf();
    let friendlyType = '';
    switch (t) {
        case CT.constant.ACCOUNT_TYPE.TRANSFER:
            friendlyType = '转账';
            break;
        case CT.constant.ACCOUNT_TYPE.REWARD:
            friendlyType = '获取奖励';
            break;
    }
    return friendlyType;
};
const randomBytesAsync = promise.promisify(crypto.randomBytes);


global.CT._.sleep = function (ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};
global.CT._.toCamel = (letter) => {
    letter = letter.replace(/[-_ ](\w)/g, function (all, letter) {
        return letter.toUpperCase();
    });
    return letter
};

function getRealSecret(secret, salt) {
    return secret.padEnd(23, salt) + salt.substr(16, 9);
}

global.CT._.encrypt = async (str, secret) => {
    let salt = await randomBytesAsync(32).then(s => s.toString('hex'));
    let cipher = crypto.createCipheriv("aes-256-cbc", getRealSecret(secret, salt), salt.substr(14, 16)); //设置加密类型 和 要使用的加密密钥
    let enc = cipher.update(str, "utf8", "hex");    //编码方式从utf-8转为hex;
    enc += cipher.final("hex"); //编码方式从转为hex;
    return [enc, salt]; //返回加密后的字符串
};

/**
 *
 * @param str
 * @param secret
 * @param salt
 * @returns {Promise<string>}
 */
global.CT._.decrypt = async (str, secret, salt) => {
    let decipher = crypto.createDecipheriv("aes-256-cbc", getRealSecret(secret, salt), salt.substr(14, 16));
    return decipher.update(str, "hex", "utf8") + decipher.final("utf8");//编码方式从utf-8;
};


global.CT._.md5 = (str, encoding = 'utf8') => {
    return crypto.createHash('md5').update(str, encoding).digest('hex');
};
global.CT._.randStr = function (len, seed) {
    seed = seed || '0123456789';
    let result = [];
    for (let i = 0; i < len; i++) {
        result.push(seed[Math.floor(Math.random() * seed.length)]);
    }
    return result.join('');
};


global.CT._.Request = async (opts) => {
    opts.timeout = opts.timeout || 30 * 1000;
    opts.json = opts.json === undefined ? true : opts.json;
    let throwError = opts.throwError === undefined ? true : opts.throwError;
    let throwErrorMsg = opts.throwErrorMsg || '';
    delete opts.throwError;
    delete opts.throwErrorMsg;
    return await new Promise((resolve, reject) => {
        request(opts,
            function (error, response, body) {
                if (error && throwError) {
                    return reject(new CT.Exception(CT.error.ERROR_PARAMS, throwErrorMsg || error.message));
                } else if (error && !throwError) {
                    console.error(`request error[${opts.uri}]:`, error);
                    return resolve(new CT.Exception(error.code || -1, throwErrorMsg || error.message || error.message));
                }
                if (opts.json) {
                    if (body.code === 0) {
                        resolve(body);
                    } else if (throwError) {
                        reject(new CT.Exception(body.code, /*`[${opts.uri}]` +*/ throwErrorMsg || body.message || body));
                    } else {
                        console.error('request error:', `[${opts.uri}]` + body);
                        resolve(new CT.Exception(body.code, /*`[${opts.uri}]` +*/ throwErrorMsg || body.message || body));
                    }
                } else {
                    resolve(body);
                }
            }
        );
    });
};
global.CT._.Request.post = async (url, data = {}, opts = {}) => {
    opts = Object.assign({}, {
        uri: url,
        method: 'post',
        json: true,
        body: data,
    }, opts);
    return await CT._.Request(opts);
};
global.CT._.Request.postForm = async (url, data = {}, opts = {}) => {
    opts = Object.assign({}, {
        uri: url,
        method: 'post',
        json: true,
        form: data,
    }, opts);
    return await CT._.Request(opts);
};
global.CT._.Request.put = async (url, data = {}, query = {}, opts = {}) => {
    opts = Object.assign({}, {
        uri: url,
        method: 'put',
        json: true,
        qs: query,
        body: data,
    }, opts);
    return await CT._.Request(opts);
};
global.CT._.Request.del = async (url, data = {}, query = {}, opts = {}) => {
    opts = Object.assign({}, {
        uri: url,
        method: 'delete',
        json: true,
        qs: query,
        body: data,
    }, opts);
    return await CT._.Request(opts);
};
global.CT._.Request.get = async (url, qs = {}, opts = {}) => {
    opts = Object.assign({}, {
        uri: url,
        method: 'get',
        json: true,
        qs: qs,
        headers: {
            'Cache-Control': 'no-cache'
        }
    }, opts);
    return await CT._.Request(opts);
};


global.CT._.mnemonicGenerate = () => {
    return mnemonicGenerate(MNEMONIC_LENGTH);
}
global.CT._.mnemonicValidate = (mnic) => {
    return mnemonicValidate(mnic);
}