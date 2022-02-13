const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const _ = require('lodash');
const infolic = require('debug')('cru-tool:lic');

try {

// 解密
    function decrypt(sign, key) {

        let iv = Buffer.from(key.substr(6, 16), 'utf8');
        let pwd = Buffer.from(key.substr(30, 32), 'utf8');
        let src = '';
        const cipher = crypto.createDecipheriv('aes-256-cbc', pwd, iv);
        let design = sign.substr(8, sign.length - 8 - 16);
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

    let licenseContent = fs.readFileSync(path.resolve(__dirname, '..', 'user.lic'), 'utf-8');

    let expired = checkLicense(licenseContent, publicKey);
    infolic(`checked license done! expired:${expired.toLocaleString()}`);
} catch (e) {
    process.exit(1001);
}