class Ctrl {
    constructor() {
    }

    async indexPage(req, res) {
        let addr = req.query.addr;
        let nameKeyword = req.query.nk;
        let where = {deleted: CT.constant.ACCOUNT_STATUS.NORMAL};
        let page = parseInt(req.query.page) || 1;
        if (addr) {
            where.address = addr;
        } else if (nameKeyword) {
            where.name = {[CT.Sequelize.Op.like]: `%${nameKeyword}%`};
        }
        let data = await CT.models.owner.findByPager(page, 20, where, {order: [['createdAt', 'desc']]});

        let addresses = data.rows.map(a => {
            return a.address
        });
        let balances = await CT.blockchain.account.getAccountListBalance(addresses);
        let stakingInfosMap = await CT.blockchain.staking.getStakingLimit(addresses);
        let lockInfos = await CT.blockchain.account.getAccountLocksInfos(addresses, CT.constant.LOCK_TYPE.STAKING);
        data.rows.forEach((a, i) => {
            let li = lockInfos[i];
            a.balance = balances[a.address].free.toHuman();
            a.stakingLimit = stakingInfosMap[a.address].stakingLimit.toHuman() || '--';
            a.guaranteeFee = stakingInfosMap[a.address].guaranteeFee.toHuman() || '--';
            a.stakingAmount = li ? li.amount.toHuman() : '--';
        });

        res.render("owner/index", {
            data: data,
            page,
            nk: nameKeyword,
            addr: addr,
        });
    }

    async addOwner(req, res) {
        let address = req.body.address;
        let name = req.body.name;
        let email = req.body.email;
        let needclaim = req.body.needclaim || 0;
        let sendEmergency = req.body.sendEmergency || 0;

        let groupInfo = await CT.BC_ENV.API.query.swork.groups(address).then(d => {
            return d.toJSON();
        }).catch(error => {
            return null;
        });
        // 临时解决方案，groups.allowlist如果存在数据时解码会报错
        if (!groupInfo) {
            let maxMemberCount = CT.BC_ENV.API.consts.swork.maxGroupSize.toNumber();
            let list = await CT._.Request.post(`${CT.config.subscanApi.endsWith('/') ? CT.config.subscanApi.substr(0, CT.config.subscanApi.length - 1) : CT.config.subscanApi}/api/scan/swork/group/members`,
                {
                    "row": maxMemberCount,
                    "page": 0,
                    "group_owner": address,
                },
                {
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
                return data.data.count > 0 ? data.data.list : [];
            });
            groupInfo = {
                members: list.map(l => {
                    return l.account_id;
                })
            }
        }

        let controller = await CT.blockchain.staking.getController(address);

        let ret = await CT.models.owner.create({
            name,
            address,
            controllerAddress: controller,
            email,
            needClaims: needclaim,
            sendEmergency
        });

        let members = [];
        groupInfo.members.forEach((m, i) => {
            members.push({
                name: `${name}_MINIER_${i + 1}`,
                address: m,
                source: address,
            });
        });

        await CT.models.member.bulkCreate(members).catch(err => {
            console.error(err);
        })

        res.json({errCode: 0});
    }

    async getOwner(req, res) {
        let id = parseInt(req.params.id);
        if (!id) {
            throw new CT.Exception(CT.error.ERROR_PARAMS);
        }

        let owner = await CT.models.owner.findOne({id: id}, {attributes: ['name', 'address', 'controllerAddress', 'email', 'needClaims', 'sendEmergency']});

        res.json({errCode: 0, data: owner});
    }

    async editOwner(req, res) {
        let id = parseInt(req.params.id);
        let name = req.body.name;
        let email = req.body.email;
        // let controllerAddress = req.body.controllerAddress;
        let needclaim = req.body.needclaim || 0;
        let sendEmergency = req.body.sendEmergency || 0;

        let owner = await CT.models.owner.findOne({id: id}, {attributes: ['name', 'address', 'controllerAddress', 'email', 'needClaims', 'sendEmergency']});
        let controller = await CT.blockchain.staking.getController(owner.address);

        let model = {name, email, needClaims: needclaim, sendEmergency};
        if (!owner.controllerAddress && controller) {
            model.controllerAddress = controller;
        } else if (owner.controllerAddress != controller) {
            model.controllerAddress = controller;
        }
        let ret = await CT.models.owner.update({id: id}, model);

        res.json({errCode: 0});
    }

    async delOwner(req, res) {
        let address = req.body.addr;
        let ret = await CT.models.owner.destroy({deleted: CT.constant.ACCOUNT_STATUS.NORMAL, address: address});
        res.json({errCode: 0});
    }

    async getOwnerUnlockList(req, res) {
        let id = parseInt(req.params.id);
        if (!id) {
            throw new CT.Exception(CT.error.ERROR_PARAMS);
        }

        let owner = await CT.models.owner.findOne({id: id}, {attributes: ['name', 'address', 'controllerAddress']});

        let data = await CT.blockchain.staking.getLedger(owner.controllerAddress);
        data = data.toJSON();
        let progress = await CT.BC_ENV.API.derive.session.progress();
        if (data && data.unlocking) {
            data.unlocking = data.unlocking.map(l => {
                return {
                    value: CT.BC_ENV.API.createType('Balance', l.value).toHuman(),
                    era: (((l.era - progress.activeEra.toNumber()) * progress.eraLength.toNumber() - progress.eraProgress.toNumber()) * CT.BC_ENV.API.consts.babe.expectedBlockTime.toNumber() / 1000).toTimeSpan()
                };
            })
        }

        res.json({errCode: 0, data: data});
    }
}

module.exports = new Ctrl();