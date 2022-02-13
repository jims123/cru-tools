const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');


if (!process.argv[2] || !process.argv[3] || !process.argv[4] || !process.argv[5]) {
    console.error('arguments ownerCount, expired, others, filePath is not valid!');
    process.exit(0);
}

const [ownerCount, expired, others] = process.argv.slice(2);

/**
 * 创建签名（使用私钥和数据）
 *
 * @param data
 * @param privateKey
 * @returns {string}
 */
function createSign(data, privateKey) {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey).toString('base64')
}

//使用公钥加密数据
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCdPsAxAsGZsgOTBTpad1kMXPsmZu2GlmWxPcNWuIVrLlr9Awk2dN9IzRcfDjB3l875zyHus73NaXeUANVj06GF+xIpsAOsQAnMqcy6PzAwuY1tP+llXYIWIpqCeBUabaK1HhYDyf7IHei4mjLD1JbisuRbiUhtqxp8AmyIz0HRkL4QF9NlxICNqp2vS2ef11/Eqq732IK+J6TTLi/Z5ayK/HV6NkN3fZ1PofQrQHK+LV6tN438WRdKfqibXlttZ2NOrupFaEpCm/n6kP+5l290NLNEgTSeH0rEYVgNFCdtcbbd5fb6ERuxcOG2eempG0J8n6vkKbPDYOqC8BcFBpMXAgMBAAECggEAXtTNS8GByJNXHH92pcB8b7xTquFANn7VbYL2H4LA09btANGn6LOrRViKrSv9huKC7J1CtZaozQziFNw71Sx4qTi1x3ZjgKpOPqPY2CnrgjclV9HHjF5MadUMocqRz5J3Igu28yoLAd0n0M0N+JRpOubwWVP93kXmfwtnMUrtQti3eXiJhs76vU7o72IHo3GjL2txJSU/l/qhnmMag/k6hvIBY3B/DDaiJfeH548rk9moJyFTeknZlfsfcwyzDalh2uPy3D5BvSFxE9+VeciMrj88P1b8OceTWoJ0fjsxywscxaFY4A7VKK01gL4k1JyoTdD2/rbSLoB9vkHQP8uIQQKBgQDn9i4u+xduni+XDErDxv8AmJwkvBu7YGIZKX1prz0Y2EV19UxJaeZg5VRF2AXnu0joZbwIlmFsUGaeYmnZFhwF0oh//zXuNGgB1eN3GUrq8Av+IBCDY+o5tDM0yvk6r404hQNmqhMzSYbBqOlPt9EoO8q5SsjaoFyXhdkzVPZReQKBgQCtimFsQHE2OyyI/hOwYItu1vuY62f54SoIlgwe9dvpOGX0a8vu1Ieft8jI/ZuTQakHQcyLnmm+M7Wa4WJSIuEKZS8BXsbGhEXBBxy5MgUf0YWSnaTtH1d3LiT4/1DJuaNB8zulayvpwZ6j40JFNFs/d6vnVMLnxDN5yA7Xctf1DwKBgCYnnFkl/Ci55GIYJ4Qki3VxpN12A6nCpOA2ruZfaNFZYbORccbxoG93yXDjo7UGXWu8sD1JXyUN5JNQ5NBMjrd2dfV36UsRW7pRkGTayDP04EQgyhaSrMhpF7MrX+uDTNtrJbARca8R/RSF0DrIpaLUkvf/kSJFFnXmEmAbLZkhAoGBAIOL19mE58xiApo9bpNOO6NjVwhNuV1S7tffVYTKfU5GMBKc+9MoSz4oxAyHITz4krYrjG9xP1qsO8cRfcQhKFEG7iCtxSOJ9I4jZASGBBhgbE39LZ2JGnX/BouwjX68NyKwy8/Sc1EYMbatd/iZfWmYvzf1qmCg+xwfKBDsvwLFAoGBALKrx2u+tBBeGGCv12E387PcbP7TKowhjM1+2vg7x+GPgPmGJgMn/aXkhPXcDq43rwxbqqqCoD4ups0UyB+OLhH0iZO8ER1D2+xiL8UOZug9n1CvcNosHrVQQmkvePa9ktGHAXf7Qpps71c+6NVjMOXVaPH75b/+xVAul8M9ww8c
-----END PRIVATE KEY-----`;

const KEY = '';

function encrypt(src, key) {
    let iv = Buffer.from(key.substr(6, 16), 'utf8');
    let pwd = Buffer.from(key.substr(30, 32), 'utf8');
    let sign = '';
    const cipher = crypto.createCipheriv('aes-256-cbc', pwd, iv);
    sign += cipher.update(src, 'utf8', 'hex');
    sign += cipher.final('hex');
    return Math.abs(~Date.now()).toString(32).padStart(16, '0') + sign + Date.now().toString(16).padEnd(16, '0').toLowerCase();
}


const key = 'ooqX2EAsftm0FBXfZK3Jk14&Pbz^qNo3I!Z%UAwoW^gE2kQkJ5ynYhu1%*oHtI7L';

let License = [
    ownerCount,
    moment().add(expired, 'days').unix(),
    others
];
let filePath = process.argv[5];
let checksum = createSign(License.join('|'), privateKey);
License.push(checksum);
const sign = encrypt(License.join('|'), key);
console.log(sign);

fs.writeFileSync(path.resolve(filePath, 'user.lic'), sign, 'utf-8');

