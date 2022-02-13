const bytenode = require('bytenode');
const fs = require('fs');
const path = require('path');
const {COPYFILE_EXCL} = fs.constants;
const curWorkDir = path.resolve(__dirname, '..');


if (!process.argv[2] || !process.argv[3]) {
    console.error('arguments is not valid!');
    process.exit(0);
}

let obfuDir = path.join(process.argv[2]);
let outputDir = path.join(process.argv[3]);
let compFilesOptions = [];
let excludes = ['node_modules', 'obf.js', '.idea', 'bc_start.js', 'compileJSC.js', 'copyStaticFiles.js', 'genFilesHash.js', 'genLicense.js', 'checksum.js', 'check_license.js'/*, 'tools'*/];
let sourceCopies = ['views', 'config', 'public', 'package.json', 'index.js', 'jscLoader.js', 'certs'];
const output = outputDir;


function readDirFiles(dir) {
    console.log('scan dir:', dir);
    let filenames = fs.readdirSync(dir);
    for (let i = 0; i < filenames.length; i++) {
        let fn = filenames[i];
        let fullPath = `${path.join(curWorkDir, dir, fn)}`;
        let newFileFullPath = `${path.join(curWorkDir, output, dir.replace(obfuDir, ''), fn)}`;
        let stat = fs.statSync(fullPath);
        if (!!~sourceCopies.findIndex(f => {
            return !!~fn.indexOf(f) || !!~dir.indexOf(f);
        })) {
            if (!fs.existsSync(`${path.join(curWorkDir, output, dir)}`)) {
                fs.mkdirSync(`${path.join(curWorkDir, output, dir)}`, {recursive: true});
            }
            if (stat.isDirectory()) {
                if (!fs.existsSync(newFileFullPath)) {
                    fs.mkdirSync(newFileFullPath, {recursive: true});
                }
                readDirFiles(path.join(dir, fn))
            } else if (stat.isFile()) {
                fs.copyFileSync(fullPath, newFileFullPath);
            }
            continue;
        }
        if (!!~excludes.findIndex(f => {
            return !!~fn.indexOf(f)
        })) {
            continue;
        }

        if (stat.isFile() && fn.endsWith('.js')) {
            if (!fs.existsSync(`${path.join(curWorkDir, output, dir)}`)) {
                fs.mkdirSync(`${path.join(curWorkDir, output, dir)}`, {recursive: true});
            }
            compFilesOptions.push({
                filename: fullPath,
                output: newFileFullPath.substr(0, newFileFullPath.length - 3) + '.jsc' // if omitted, it defaults to '/path/to/your/file.jsc'
            });
        } else if (stat.isDirectory()) {
            if (!fs.existsSync(newFileFullPath)) {
                fs.mkdirSync(newFileFullPath, {recursive: true});
            }
            readDirFiles(path.join(dir, fn))
        }
    }
}

readDirFiles(obfuDir);

let queue = [];
compFilesOptions.forEach(f => {
    console.log(f.filename, '=>', f.output);
    queue.push(bytenode.compileFile(f));
});

Promise.all(queue).then().catch(err => {
    console.error(err);
}).finally(() => {

    console.log('compiled!');
    process.exit(0);
});