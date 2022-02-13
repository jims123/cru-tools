let fs = require('fs');
let BaseModel = require('./base');

let dirs = fs.readdirSync(__dirname);

let models = {};
for (let i = 0; i < dirs.length; i++) {
  let file = dirs[i];
  if (/\.js(c)?$/ig.test(file) && !~[/index\.js(c)?$/ig, /subscribe\.js(c)?$/ig].findIndex(r => {
    return r.test(file);
  })) {
    let name = file.replace(/\.js(c)?$/ig, '');
    models[CT._.toCamel(name)] = require(`./${file}`);
  }
}

function genCRUDModel() {
  for (let k in CT.db.models) {
    if (!models[k]) {
      let model = new BaseModel(k, 'db');
      models[k] = model;
    }
  }
}

// 生成只有基本操作的表数据接口
genCRUDModel();

module.exports = models;
