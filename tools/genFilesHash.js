const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const _ = require('lodash');
const hashFileList = ['common', 'bin', 'blockchain', 'controllers', 'models', 'routers', 'schemas', 'views', 'public', 'tools', /app\.js(c)?$/];


if (!process.argv[2]) {
    console.error('arguments is not valid!');
    process.exit(0);
}

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
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCq0SVAgMkKUJGPHwRmkh3mhexc9RgM1CmtIqP6f99p6+VBDKwltzYXOVxHiEaEHo2ER4PwbtSP3NGaPZ3yrB3erWWL5SuwGp41rcUW8q/gqf2z3QEOV7RSPLIzPKoq3p96JWAxljbML6S3nC2WMIISIxrwUuRkM6RU2OUy0Du0TTDFGDvIB4hoaPHfcVTMVmQWkrLKmiMZwEIvH9zAGNxgzPHskBnrx+QhB0mb2J3Z6fdQpQpLFFc2El8fh3fLKyLNrnTM1Bl5ivsHjs2WY4uFxklah3PusNu7HaWxvq9VfRjwTf8yOmefoto2BvlbggkXT8OmaZqJDWT03PbwfQttAgMBAAECggEBAKajjdHVUUrsunOC8MoXdW/z6lftCl9JgrbSemHf6VXtuSKyeCX7C5uwa6OlABXXsHsBQWeG13rZEumDftjErAcV5WCKWwpbjUgUk5cFfiqP615SFbumN9WaPMXbQq67q5x/Zc46Go8rU2eDxr0j6WBEOv2EACb4cjILvdzKY9RJeWfLIEF8HLv4qQ2hAyxi2nF1tnL21Jc+C0VEBGYNEeRTdSPRiacx/jwqpX3mFX1x0ktw50zD/oMxLPvNAefpl6NKNQB0e84t1jaBwsfeWZxT4yVJRFcEhRSTOWbUgBRIhkgy2P74TJq7vFfV73GlCY9MrVD4VRiCvO9fcbdPRAkCgYEA04ep/3axr1/aS/T3XyL9b85HL9/l+dysBVlFjIRK9oYv0S+w9CEj+WP1b2XSjckxU5TxYWbBcixCFRUH7UTcv+Fjor1e4WUJxzaNcqGHEffscJ0hPhz+4bzMb2OASTnAU3U7P+uy5xDnB3U2yMIUO2YHIANBm/RnveLvDzsA5asCgYEAzrpZbAU9SRvRyxK1qn2KzWSemv60COSX4BYjT15Sb01Xuv7pvqJeQWEXYzCq+KSe2qH9kKLd/ClTzuLXYocXz9sXVZPN7vpiGMVq3fDonALMLbwbuApPZwmZgsKgzweHtuUS81qb3GJVpD4wffX2YSe9r3mWNjwTj2e6cI8dC0cCgYEAqtAwjOSSU6Y5p4CniaG9ul1+ysAo+/4gwyj1qqThy/VMA8ZZRKrGXAtGFLDKuEgxlub9jMPnjoUCz/dtsUIcaK5fQPle9vAaV05MJrcdVXs46S9Zusi7YhqNk51r6LXEAyD1uYZhr4nMpg8XMELZB6Y6NrWqc3+HjqUEmu3wqYUCgYAnjxdfiV0h6VXrE0h6OI3gIfoL1OOktAGwGuxk2rrRm65HFVKrbSy2PBsamwyMigvv8IGyNMhf4ZStCVGIBCv1VYqQkLkemwE8lkKN9/S7LfneYpm3TRnGsNqUYCQfmeRJhmpq8RLUSGj1BgWHhRLBorY0pwKsnDBuB75wnaJELwKBgQCGSFma7nCCrYHI4hfgTWuHFGVBQEz1+GrO8zjUkrGJh7zwzAZPAsebuGbWyENFLDSzVg7kVIcpYv0uEWuBSGUHQtg7k2uJ+A1Zj2xQtxzXo+fq1jxdsAqqHl+fpRrmRXE+vIdZreVMzaVxxxu7oQKQ7shh84srqrJQIXXuZ7hb2Q==
-----END PRIVATE KEY-----`;

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
                    err && console.error(err);
                });
            }
        });
        input.on('error', j);
    });
}

let rootPath = path.join(process.argv[2]);

if (!path.isAbsolute(rootPath)) {
    console.error('directory must be absolute path!', rootPath);
    process.exit(0);
}

const stack = [];

function checkInHashList(filename) {
    return !!~hashFileList.findIndex(filter => {
        return _.isRegExp(filter) ? filter.test(filename) : !!~filename.indexOf(filter);
    })
}

function checkFilePathType(filepath) {
    let stat = fs.lstatSync(filepath);
    return stat.isDirectory() ? 'dir' : (stat.isFile() ? 'file' : '');
}


console.time('generate checksum file done.');

const fileList = [];
let tree = fs.readdirSync(rootPath);


for (let i = 0, curDir = rootPath, stackPop = null; i < tree.length || (stack.length > 0 && (stackPop = stack.pop(), curDir = stackPop.curDir, tree = stackPop.data, i = stackPop.index + 1, !0)); i++) {
    if (i >= tree.length) {
        continue;
    }
    let filename = tree[i];
    let absFilePath = path.resolve(curDir, filename);
    if (checkInHashList(absFilePath)) {
        let fileType = checkFilePathType(absFilePath);
        if (fileType == 'dir') {
            stack.push({
                curDir: curDir,
                index: i,
                data: tree
            });
            i = -1;
            curDir = absFilePath;
            tree = fs.readdirSync(absFilePath);
            continue;
        } else if (fileType == 'file') {
            fileList.push({
                filePath: absFilePath,
                checksum: '',
            });
        }
    }
}

async function genHashFiles() {

    let checksumData = [];

    for (let i = 0; i < fileList.length; i++) {
        let checksum = await fileSha256Hash(fileList[i].filePath).catch(err => {
            console.error(err);
            process.exit(0);
        });
        fileList[i].checksum = checksum;
        fileList[i].filePath = path.relative(rootPath, fileList[i].filePath).replaceAll(/[\\]/ig, '\/');
        checksumData.push(fileList[i].checksum, fileList[i].filePath);
    }

    let sign = createSign(checksumData.join('|ctm|').replaceAll(/[\\\/]/ig, ''), privateKey);


    let fileData = {
        checksumList: fileList,
        checksum: sign
    }

    let checksumFilePath = path.resolve(rootPath, 'checksums.json');
    fs.writeFileSync(checksumFilePath, JSON.stringify(fileData, 4, 2), {encoding: 'utf-8'});

    return checksumFilePath;
}

genHashFiles().then(d => {
    console.info(d);
    console.timeEnd('generate checksum file done.');
    console.info('total handle ', fileList.length, 'files');
})
    .catch(err => {
        console.error(err);
    });