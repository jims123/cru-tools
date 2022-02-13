class Ctrl {
    constructor() {
    }

    async indexPage(req, res) {
        let addr = req.query.addr;
        let nameKeyword = req.query.nk;
        let where = {};
        let page = parseInt(req.query.page) || 1;
        let pageSize = parseInt(req.query.pageSize) || 20;
        if (addr) {
            where.address = addr;
        } else if (nameKeyword) {
            where.name = {[CT.Sequelize.Op.like]: `%${nameKeyword}%`};
        }
        let data = await CT.models.member.findByPager(page, pageSize, where, {order: [['createdAt', 'desc']],});

        let ownerAddresses = [], memberAddresses = [];
        data.rows.forEach(r => {
            ownerAddresses.push(r.source);
            memberAddresses.push(r.address);
        });
        ownerAddresses = CT._.uniq(ownerAddresses);

        let reports = await CT.db.query(`SELECT a.* FROM (SELECT MAX(report_slot) AS slot,address FROM \`t_report\` AS \`report\` WHERE \`report\`.\`address\` IN (:addresses) GROUP BY \`address\`) AS idt LEFT JOIN t_report a ON idt.slot = a.report_slot and idt.address = a.address `,
            {
                replacements: {addresses: memberAddresses.length === 0 ? [''] : memberAddresses},
                type: CT.Sequelize.QueryTypes.SELECT,
                model: CT.schemas.report,
                mapToModel: true
            });
        let reportMap = CT._.keyBy(reports, 'address');

        let owners = await CT.models.owner.findAll({});
        let ownerMap = {};
        owners.forEach(o => {
            ownerMap[o.address] = o.name;
        });
        let addresses = data.rows.map(a => {
            return a.address
        });
        let balances = await CT.blockchain.account.getAccountListBalance(addresses);
        data.rows.forEach(a => {
            a.balance = balances[a.address].free.toHuman();
            a.reportInfo = reportMap[a.address] || null;
        });

        res.render("member/index", {
            data: data,
            page,
            pageSize,
            nk: nameKeyword,
            addr: addr,
            owners,
            ownerMap
        });
    }

    async addMember(req, res) {
        let address = req.body.address;
        let name = req.body.name;
        let source = req.body.source;

        let mem = await CT.models.member.create({
            name,
            address,
            source,
        });

        res.json({errCode: 0});
    }

    async editMember(req, res) {
        let id = parseInt(req.params.id);
        let address = req.body.address;
        let name = req.body.name;
        let source = req.body.source;

        if (!id) {
            throw new CT.Exception(CT.error.ERROR_PARAMS);
        }

        let mem = await CT.models.member.update({id: id}, {
            name,
            address,
            source,
        });

        res.json({errCode: 0});
    }

    async getMember(req, res) {
        let id = parseInt(req.params.id);
        if (!id) {
            throw new CT.Exception(CT.error.ERROR_PARAMS);
        }

        let mem = await CT.models.member.findOne({id: id}, {attributes: ['name', 'address', 'source']});

        res.json({errCode: 0, data: mem});
    }

    async delMember(req, res) {
        let address = req.body.addr;
        let ret = await CT.models.member.destroy({address: address});
        CT.models.member.delCacheMemberByAddress(address);
        res.json({errCode: 0});
    }


    async reportList(req, res) {
        let id = req.params.id;
        let page = parseInt(req.query.page) || 1;
        let pageSize = parseInt(req.query.pageSize) || 20;

        let member = await CT.models.member.findOne({id: id});

        let data = await CT.models.report.findByPager(page, pageSize, {address: member.address}, {
            order: [['reportTime', 'desc']],
            raw: false
        });

        data.rows.forEach(a => {
            a.spowerH = CT.humanize.fileSize(a.spower);
            a.freeH = CT.humanize.fileSize(a.free);
            a.reportedFilesSizeH = CT.humanize.fileSize(a.reportedFilesSize);
        });

        res.render("member/reports", {
            data: data,
            member,
            page,
            pageSize,
        });
    }

    async fillReportList(req, res) {
        let id = req.params.id;
        let member = await CT.models.member.findOne({id: id});
        await CT.models.report.destroy({address: member.address}, {throwError: false});
        let workReports = await CT._.Request.post(`${CT.config.subscanApi.endsWith('/') ? CT.config.subscanApi.substr(0, CT.config.subscanApi.length - 1) : CT.config.subscanApi}/api/scan/extrinsics`, {
            "row": CT.constant.FILL_WORKREPORT_LIMIT,
            "page": 0,
            "address": member.address,
            "signed": "all",
            "module": "swork",
            "call": "report_works"
        }, {
            json: true,
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "zh-CN",
                "content-type": "application/json",
                "sec-ch-ua": ' "Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "Windows",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "Referer": "https://crust.subscan.io/",
                "Referrer-Policy": "origin-when-cross-origin"
            },
        }).then(data => {
            return data.data.extrinsics;
        });

        let insertReportModels = [];
        workReports.forEach(r => {
            let reportParams = JSON.parse(r.params);
            let reportInfo = {};
            reportParams.forEach(p => {
                reportInfo[p.name] = p.value;
            });
            insertReportModels.push({
                'address': member.address,
                'punishmentDeadline': 0,
                'reportSlot': reportInfo.slot,
                'spower': 0,
                'free': reportInfo.reported_srd_size,
                'reportedFilesSize': reportInfo.reported_files_size,
                'reportedSrdRoot': reportInfo.reported_srd_root,
                'reportedFilesRoot': reportInfo.reported_files_root,
                'reportTime': r.block_timestamp
            });
        });


        let ret = await CT.models.report.bulkCreate(insertReportModels);

        res.json({erCode: 0});
    }
}

module.exports = new Ctrl();