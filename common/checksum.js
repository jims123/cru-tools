const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const _ = require('lodash');
const info = require('debug')('cs');
const error = console.error.bind(console);

try {

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
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqtElQIDJClCRjx8EZpId5oXsXPUYDNQprSKj+n/faevlQQysJbc2FzlcR4hGhB6NhEeD8G7Uj9zRmj2d8qwd3q1li+UrsBqeNa3FFvKv4Kn9s90BDle0UjyyMzyqKt6feiVgMZY2zC+kt5wtljCCEiMa8FLkZDOkVNjlMtA7tE0wxRg7yAeIaGjx33FUzFZkFpKyypojGcBCLx/cwBjcYMzx7JAZ68fkIQdJm9id2en3UKUKSxRXNhJfH4d3yysiza50zNQZeYr7B47NlmOLhcZJWodz7rDbux2lsb6vVX0Y8E3/Mjpnn6LaNgb5W4IJF0/DpmmaiQ1k9Nz28H0LbQIDAQAB
-----END PUBLIC KEY-----`;

    async function fileSha256Hash(filepath) {
        const sha256hash = crypto.createHash('sha256');
        const input = fs.createReadStream(filepath, {encoding: null});
        return new Promise((r, j) => {
            input.on('readable', () => {
                // Only one element is going to be produced by the
                // hash stream.
                const data = input.read();
                if (data)
                    sha256hash.update(data);
                else {
                    r(sha256hash.digest('hex'));
                    input.close(err => {
                        err && error(err);
                    });
                }
            });
            input.on('error', j);
        });
    }

    let checksumFileContent = fs.readFileSync(path.resolve(__dirname, '..', 'checksums.json'), 'utf-8');


    async function checkHashFiles(rootPath) {

        let checksumData = [];
        let checksumFileJson = JSON.parse(checksumFileContent);

        for (let i = 0; i < checksumFileJson.checksumList.length; i++) {
            checksumData.push(checksumFileJson.checksumList[i].checksum, checksumFileJson.checksumList[i].filePath);
        }

        let verified = verifySign(checksumData.join('|ctm|').replaceAll(/[\\\/]/ig, ''), checksumFileJson.checksum, publicKey);
        if (!verified) {
            process.exit(1001);
        }

        let hashFileList = checksumFileJson.checksumList;
        for (let i = 0; i < hashFileList.length; i++) {
            let checksum = await fileSha256Hash(path.resolve(rootPath, hashFileList[i].filePath)).catch(err => {
                error(err);
                process.exit(1001);
            });
            if (checksum != hashFileList[i].checksum) {
                process.exit(1001);
            }
        }

        return checksumFileJson;
    }

    // checkHashFiles('D:\\WebstormProjects\\jsc-cru_tool').then(d => {
    checkHashFiles(path.resolve(__dirname, '..')).then(d => {
        info(`checked ${d.checksumList.length} files done!`);
    })
} catch (e) {
    process.exit(1001);
}