const fs = require('fs');
const path = require('path');
const _ = require("lodash");
let sourceCopies = ['views', 'config', 'public', 'jscLoader.js', 'certs'];

if (!process.argv[2] || !process.argv[3]) {
    console.error('arguments is not valid!');
    process.exit(0);
}


let sourceRootPath = path.join(process.argv[2]);
let targetRootPath = path.join(process.argv[3]);

let tree = fs.readdirSync(path.resolve(__dirname, '..'));


function checkInList(filename) {
    return !!~sourceCopies.findIndex(filter => {
        return _.isRegExp(filter) ? filter.test(filename) : !!~filename.indexOf(filter);
    })
}

function checkFilePathType(filepath) {
    let stat = fs.lstatSync(filepath);
    return stat.isDirectory() ? 'dir' : (stat.isFile() ? 'file' : '');
}

const stack = [];
for (let i = 0, curDir = sourceRootPath, stackPop = null; i < tree.length || (stack.length > 0 && (stackPop = stack.pop(), curDir = stackPop.curDir, tree = stackPop.data, i = stackPop.index + 1, !0)); i++) {
    if (i >= tree.length) {
        continue;
    }

    let filename = tree[i];
    let absFilePath = path.resolve(curDir, filename);
    if (checkInList(absFilePath)) {
        let fileType = checkFilePathType(absFilePath);
        if (fileType == 'dir') {
            let newFilePath = path.resolve(targetRootPath, path.relative(sourceRootPath, absFilePath));
            if (!fs.existsSync(newFilePath)) {
                fs.mkdirSync(newFilePath, {recursive: true});
            }
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
            let newFilePath = path.resolve(targetRootPath, path.relative(sourceRootPath, absFilePath));
            fs.copyFileSync(absFilePath, newFilePath);
            console.info(`${absFilePath} => ${newFilePath}`);
        }
    }
}
console.info('copy files done!')