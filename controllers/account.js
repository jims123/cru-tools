
class Ctrl {
    constructor() {
    }

    async indexPage(req, res) {
        let addr = req.query.addr;
        let nameKeyword = req.query.nk;
        let where = {deleted: CT.constant.ACCOUNT_STATUS.NORMAL, type: CT.constant.ACCOUNT_TYPE.REWARD};
        let page = parseInt(req.query.page) || 1;
        let pageSize = parseInt(req.query.pageSize) || 20;
        if (addr) {
            where.address = addr;
        } else if (nameKeyword) {
            where.name = {[CT.Sequelize.Op.like]: `%${nameKeyword}%`};
        }
        let data = await CT.models.account.findByPager(page, pageSize, where, {order: [['createdAt', 'desc']]});

        let transferAccounts = await CT.models.account.findAll({
            deleted: CT.constant.ACCOUNT_STATUS.NORMAL,
            type: CT.constant.ACCOUNT_TYPE.TRANSFER
        });
        let addresses = data.rows.map(a => {
            return a.address
        });
        let balances = await CT.blockchain.account.getAccountListBalance(addresses);
        data.rows.forEach(a => {
            a.balance = balances[a.address].free.toHuman();
        });

        res.render("account/index", {
            data: data,
            page,
            nk: nameKeyword,
            addr: addr,
            transferAccounts,
            pageSize
        });
    }

    async batchAddAccounts(req, res) {
        let data = CT._.pick(req.body, ['count', 'namePrefix']);
        data.count = parseInt(data.count);
        let accounts = [];
        let krps = [];
        let randomFix = CT._.randStr(CT._.random(3, 6, false), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
        for (let i = 0, name = '', mnemonic = '', kp = {}; i < data.count; i++) {
            mnemonic = CT._.mnemonicGenerate();
            name = `${data.namePrefix}_${randomFix}_${i + 1}`;
            kp = await CT.blockchain.account.createAccount(name, mnemonic);
            mnemonic = await CT._.encrypt(mnemonic, CT.config.secret);
            krps.push(kp);
            accounts.push({
                ...kp,
                name,
                mnemonic: mnemonic.join('|'),
                type: CT.constant.ACCOUNT_TYPE.REWARD,
                source: CT.constant.ACCOUNT_SOURCE.BATCH
            });
        }

        let ret = await CT.models.account.bulkCreate(accounts.map(a => {
            return CT._.pick(a, ['name', 'address', 'mnemonic', 'source', 'type'])
        }));

        for (let i = 0; i < krps.length; i++) {
            CT.BC_ENV.keyRing.addPair(krps[i]);
        }
        res.json({errCode: 0});
    }

    async delAccount(req, res) {
        let address = req.body.addr;
        let ret = await CT.models.account.remove({deleted: CT.constant.ACCOUNT_STATUS.NORMAL, address: address});
        let kpIndex = CT.BC_ENV.keyRing.pairs.findIndex(p => {
            return p.address == address;
        });
        if (~kpIndex) {
            CT.BC_ENV.keyRing.removePair(address);
        }
        res.json({errCode: 0});
    }

    async transferAccount(req, res) {
        let addresses = req.body.addresses;
        let taddress = req.body.taddress;
        let type = req.body.type;
        let balance = parseFloat(req.body.balance);
        addresses = addresses.split(',');
        if (!addresses.length || !taddress || !balance || !type) {
            throw new CT.Exception(CT.error.ERROR_PARAMS);
        }
        if (balance > 500 || balance < 0) {
            throw new CT.Exception(CT.error.ERROR_PARAMS, '转账金额只能再0.01-500之间!');
        }
        let txHash = await CT.blockchain.account.batchTransfer(taddress, addresses, balance * Math.pow(10, 12));
        res.json({errCode: 0, data: txHash.toString()});
    }

    async retrieveTransfer(req, res) {
        let addresses = req.query.addresses;
        let taddress = req.query.taddress;
        let type = req.query.type;
        let balance = parseFloat(req.query.balance);

        if (!addresses.length || !taddress || !balance || !type) {
            throw new CT.Exception(CT.error.ERROR_PARAMS);
        }
        if (balance > 500 || balance < 0) {
            throw new CT.Exception(CT.error.ERROR_PARAMS, '转账金额只能再0.01-500之间!');
        }
        addresses = addresses.split(',');
        let fee = await CT.blockchain.account.retrieveTransfer(taddress, addresses, balance * Math.pow(10, 12));
        res.json({errCode: 0, data: fee.toHuman()});
    }

    async downloadJson(req, res){
        let address = req.query.address;
        let pwd = req.query.pwd;
        let account = await CT.models.account.findOne({address:address});
        let encryptData = account.mnemonic.split('|');
        let mnemonic = await CT._.decrypt(encryptData[0], CT.config.secret, encryptData[1]);

        let kp = await CT.BC_ENV.keyRing.pairs.find((kp)=>{
            return account.address == kp.address;
        });

        res.attachment(`${account.address}.json`);
        res.send(JSON.stringify(kp.toJson(pwd)));

    }
}

module.exports = new Ctrl();