/**
 * Created by smallwolf on 2017/8/11.
 */
'use strict';

let BaseModel = require('./base');


class User extends BaseModel {
  constructor() {
    super('account');
  }

  async create(data, opts) {
    // if (data.realName) {
    //   data.realName = CT._.toBase64(data.realName);
    // }
    // if (data.nickname) {
    //   data.nickname = CT._.toBase64(data.nickname);
    // }
    let userModel = CT._.pick(data, ['name', 'address', 'mnemonic', 'genesisHash', 'source', 'type']);
    let user = await super.create(userModel, opts);
    return user;
  }

  async findOne(where, opts) {
    let data = await super.findOne(where, opts);
    // if (data && data.realName) {
    //   data.realName = CT._.fromBase64(data.realName);
    // }
    // if (data && data.nickname) {
    //   data.nickname = CT._.fromBase64(data.nickname);
    // }
    return data;
  }

  async findAll(where, opts) {
    let data = await super.findAll(where, opts);
    // for (let i = 0; i < data.length; i++) {
    // if (data[i].name) {
    //   data[i].name = CT._.fromBase64(data[i].name);
    // }
    // }
    return data;
  }

  async findByPager(page = 1, pageSize = 10, where, opts = {}) {
    let data = await super.findByPager(page, pageSize, where, opts);
    let userIds = [];
    for (let i = 0; i < data.rows.length; i++) {
      // if (data.rows[i].realName) {
      //   data.rows[i].realName = CT._.fromBase64(data.rows[i].realName);
      // }
      // if (data.rows[i].nickname) {
      //   data.rows[i].nickname = CT._.fromBase64(data.rows[i].nickname);
      // }
      userIds.push(data.rows[i].id);
    }

    return data;
  }

  async update(where, data, opts = {}) {

    let userModel = CT._.pick(data, ['name', 'address', 'genesisHash', 'mnemonic', 'updatedAt', 'source', 'type']);
    let affect = await super.update(where, userModel, opts);
    return affect;
  }

}

module.exports = new User;