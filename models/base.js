/**
 * Created by smallwolf on 2017/8/11.
 */
'use strict';

class Model {
  constructor(schemaName, db = 'db') {
    this._orm = CT[db].models[schemaName];
    if (!this._orm) {
      throw new Error(`Fuck, are you kidding me? I can't find ORM that name is [${schemaName}].`);
    }
    this.sequelize = this._orm.sequelize;
  }

  async findAll(where, opts = {}) {
    if (opts.raw === undefined) {
      opts.raw = true;
    }
    opts.where = where;
    return await this._orm.findAll(opts);
  }

  async findOne(where, opts = {}) {
    if (opts.raw === undefined) {
      opts.raw = true;
    }
    opts.where = where;
    let throwErr = true;
    let errMsg = opts.errMsg;
    if (opts.throwError !== undefined) {
      throwErr = opts.throwError;
    }
    delete opts.throwError;
    delete opts.errMsg;
    let data = await this._orm.findOne(opts);
    if (!data && throwErr) {
      throw new CT.Exception(CT.errors.ERROR_DATA_NOEXISTED, errMsg, undefined, this._orm.name);
    }
    return data;
  }

  async update(where, data, opts = {}) {
    if (opts.raw === undefined) {
      opts.raw = true;
    }
    opts.where = where;

    let throwErr = true;
    let errMsg = opts.errMsg;
    if (opts.throwError !== undefined) {
      throwErr = opts.throwError;
    }
    delete opts.throwError;
    delete opts.errMsg;

    if (!data.updatedAt) {
      data.updatedAt = Math.floor(Date.now() / 1000);
    }
    let affect = await this._orm.update(data, opts);
    if (affect[0] === 0 && throwErr) {
      throw new CT.Exception(CT.errors.ERROR_DATA_UPDATE_FAILED, errMsg, undefined, this._orm.name);
    }
    return affect[0];
  }

  async insertOrUpdate(data, opts = {}) {
    let throwErr = true;
    let errMsg = opts.errMsg;
    if (opts.throwError !== undefined) {
      throwErr = opts.throwError;
    }
    delete opts.throwError;
    delete opts.errMsg;

    if (!data.createdAt) {
      data.createdAt = Math.floor(Date.now() / 1000);
    }
    if (!data.updatedAt) {
      data.updatedAt = Math.floor(Date.now() / 1000);
    }
    let affect = await this._orm.upsert(data, opts);
    if (!affect && throwErr) {
      throw new CT.Exception(CT.errors.ERROR_DATA_UPDATE_FAILED, errMsg, undefined, this._orm.name);
    }
    return affect ? 1 : 0;
  }

  async remove(where, opts = {}) {
    opts.where = where;
    let data = {deleted: CT.constant.ACCOUNT_STATUS.DELETED};
    let throwErr = true;
    let errMsg = opts.errMsg;
    if (opts.throwError !== undefined) {
      throwErr = opts.throwError;
    }
    delete opts.throwError;
    delete opts.errMsg;

    if (!data.updatedAt) {
      data.updatedAt = Math.floor(Date.now() / 1000);
    }
    let affect = await this._orm.update(data, opts);
    if (affect[0] === 0 && throwErr) {
      throw new CT.Exception(CT.error.ERROR_UNKNOWN, errMsg, undefined, this._orm.name);
    }
    return affect[0];
  }

  async destroy(where, opts = {}) {
    opts.where = where;

    let throwErr = true;
    if (opts.throwError !== undefined) {
      throwErr = opts.throwError;
    }
    delete opts.throwError;
    let affect = await this._orm.destroy(opts);
    if (affect === 0 && throwErr) {
      throw new CT.Exception(CT.error.ERROR_UNKNOWN, undefined, undefined, this._orm.name);
    }
    return affect;
  }

  async create(data, opts = {}) {
    let throwErr = true;
    if (opts.throwError !== undefined) {
      throwErr = opts.throwError;
    }
    delete opts.throwError;


    if (!data.createdAt) {
      data.createdAt = Math.floor(Date.now() / 1000);
    }
    if (!data.updatedAt) {
      data.updatedAt = data.createdAt;
    }
    let affect = await this._orm.create(data, opts);
    if (!(affect.id || affect.userId) && throwErr) {
      throw new CT.Exception(CT.errors.ERROR_DATA_CREATE_FAILED, undefined, undefined, this._orm.name);
    }
    return affect;
  }

  async bulkCreate(data, opts) {

    let curTimestamp = Math.floor(Date.now() / 1000);
    for (let i = 0; i < data.length; i++) {
      if (!data[i].createdAt) {
        data[i].createdAt = curTimestamp;
      }
      if (!data[i].updatedAt) {
        data[i].updatedAt = data[i].createdAt;
      }
      if(data[i].meta){
        data[i].meta = JSON.stringify(data[i].meta);
      }
    }

    let ret = await this._orm.bulkCreate(data, opts);
    return ret;
  }

  async findByPager(page = 1, pageSize = 10, where, opts = {}, offsetFix = 0) {
    if (opts.raw === undefined) {
      opts.raw = true;
    }

    page = page * 1;
    pageSize = pageSize * 1;

    opts.limit = pageSize;
    opts.offset = (page - 1) * pageSize + offsetFix;
    opts.where = where;
    let data = await this._orm.findAndCountAll(opts);
    data.totalPage = Math.ceil(data.count / pageSize);
    data.pageSize = pageSize;
    data.page = page;
    return data;
  }

  async count(where, opts = {}) {
    if (opts.raw === undefined) {
      opts.raw = true;
    }

    opts.where = where;
    let data = await this._orm.count(opts);
    return data;
  }
}

module.exports = Model;