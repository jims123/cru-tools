

module.exports = async function (){
    let data = await CT.models.account.findAll({deleted: CT.constant.ACCOUNT_STATUS.NORMAL});

    for(let i = 0; i < data.length; i++){
        let acc = data[i];
        let encryptData = acc.mnemonic.split('|');
        let mnemic = await CT._.decrypt(encryptData[0], CT.config.secret, encryptData[1]);
        let kp = await CT.blockchain.account.loadAccount(acc.name, mnemic, undefined, acc.createdAt);
    }

    console.log('database account loaded!');
}