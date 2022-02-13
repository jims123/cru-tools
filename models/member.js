/**
 * Created by smallwolf on 2017/8/11.
 */
'use strict';

let BaseModel = require('./base');
let MEMBER_CACHE = {
    members: new Map(),
    cachedTime: 0,
    isUpdating: false
};


class User extends BaseModel {
    constructor() {
        super('member');
    }

    async create(data, opts) {
        // if (data.realName) {
        //   data.realName = CT._.toBase64(data.realName);
        // }
        // if (data.nickname) {
        //   data.nickname = CT._.toBase64(data.nickname);
        // }
        let userModel = CT._.pick(data, ['name', 'address', 'source']);
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
            userIds.push(data.rows[i].id);
        }

        return data;
    }

    async update(where, data, opts = {}) {

        let userModel = CT._.pick(data, ['name', 'address', 'updatedAt', 'source', 'lastWorkloadReportId', 'lastReportTime', 'lastReportSlot', 'oldWorkloadReportId']);
        let affect = await super.update(where, userModel, opts);
        return affect;
    }

    async checkMemberExist(address) {
        if (!MEMBER_CACHE.isUpdating && Date.now() - MEMBER_CACHE.cachedTime > CT.constant.MEMBER_CACHE_EXPIRED_TIMESPAN) {
            MEMBER_CACHE.isUpdating = true;
            let members = await this.findAll({}, {attributes: ['id', 'name', 'address']});
            members.forEach(m => {
                MEMBER_CACHE.members.set(m.address, m);
            });
            MEMBER_CACHE.cachedTime = Date.now();
            MEMBER_CACHE.isUpdating = false;
        }

        return MEMBER_CACHE.members.has(address);
    }

    delCacheMemberByAddress(address) {
        MEMBER_CACHE.members.delete(address);
    }
}

module.exports = new User;