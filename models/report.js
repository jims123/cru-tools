/**
 * Created by smallwolf on 2017/8/11.
 */
'use strict';

let BaseModel = require('./base');


class User extends BaseModel {
    constructor() {
        super('report');
    }

    async create(data, opts) {
        let userModel = CT._.pick(data, ['address', 'reportSlot', 'spower', 'free', 'reportedFilesSize', 'reportTime', 'reportedSrdRoot', 'reportedFilesRoot', 'punishmentDeadline']);
        userModel.totalSize = userModel.free + userModel.reportedFilesSize;
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

    /**
     * 查询当前slot是否存在报告，如果不存在则创建
     * @param addressInfos {Object<address, reportTime>}
     * @returns {Promise<*>}
     */
    async findCurrentSlotReportsInSlotOrInsert(addressInfos) {
        let where = {[CT.Sequelize.Op.or]: []};
        let addressInfoMap = {};
        let addresses = addressInfos.map(a => {
            addressInfoMap[a.address] = a.reportTime || Date.now();
            return a.address;
        });
        let reports = await CT.blockchain.swork.getWorkerReports(addresses);

        reports.forEach((r, i) => {
            let address = addresses[i];
            where[CT.Sequelize.Op.or].push({
                address: address,
                reportSlot: r.report_slot
            });
        });
        let data = await this.findAll(where, {attributes: ['address', 'reportSlot']});

        let reportedAddresses = data.map(d => {
            return {address: d.address, reportSlot: d.reportSlot};
        });

        let needInsertReportAddresses = CT._.differenceBy(addressInfos, reportedAddresses, (a) => {
            return `${a.address}_${a.reportSlot}`;
        });
        if (needInsertReportAddresses.length === 0) {
            return;
        }


        let insertReportModels = [];
        for (let i = 0, report = {}, address = '', reportTime = 0; i < needInsertReportAddresses.length; i++) {
            address = needInsertReportAddresses[i].address;
            reportTime = addressInfoMap[address] || Date.now();
            report = reports[i];
            insertReportModels.push({
                'address': address,
                'punishmentDeadline': report.punishment_deadline,
                'reportSlot': report.report_slot,
                'spower': report.spower,
                'free': report.free,
                'reportedFilesSize': report.reported_files_size,
                'reportedSrdRoot': report.reported_srd_root,
                'reportedFilesRoot': report.reported_files_root,
                'reportTime': Math.floor(reportTime / 1000)
            });
        }

        let ret = await this.bulkCreate(insertReportModels);

        return ret;
    }
}

module.exports = new User;