let fs = require('fs');

let dirs = fs.readdirSync(__dirname);

let models = {};
for (let i = 0; i < dirs.length; i++) {
    let file = dirs[i];
    if (/\.js(c)?$/ig.test(file) && !~[/index\.js(c)?$/ig].findIndex(r => {
        return r.test(file);
    })) {
        let name = file.replace(/\.js(c)?$/ig, '');
        models[CT._.toCamel(name)] = require(`./${file}`);
    }
}

module.exports = models;
