const stmp = require("../common/email");

class Ctrl {
    constructor() {
    }

    async indexPage(req, res) {
        let addr = req.query.addr;
        let nameKeyword = req.query.nk;
        let where = {};
        let page = parseInt(req.query.page) || 1;
        if (addr) {
            where.ownerAddress = addr;
        }
        let balance = await CT.blockchain.account.getAccountBalance(CT.BC_ENV.REWARD_ACCOUNT_PAIR.address);
        let data = await CT.models.eraReward.findByPager(page, 20, where, {order: [['eraIndex', 'desc']]});

        data.rows.forEach(a => {
            let partialFee = CT.BC_ENV.API.createType('Balance', a.partialFee);
            a.partialFee = partialFee.toHuman();
        });

        res.render("reward/index", {
            data: data,
            page,
            nk: nameKeyword,
            addr: addr,
            balance
        });
    }

    async delLog(req, res) {
        let id = req.body.id;
        let ret = await CT.models.eraReward.destroy({id: id});
        res.json({errCode: 0});
    }

    async sendEmail(req, res) {
        let era = req.body.era;
        let ret = await stmp.sendEraClaimed([era]);
        res.json({errCode: 0});
    }
}

module.exports = new Ctrl();