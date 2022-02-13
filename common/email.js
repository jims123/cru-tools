const nodemailer = require("nodemailer");
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const claimedTemplate = fs.readFileSync(path.resolve(__dirname, '../views/email_templ/claimed.ejs'), {encoding: 'utf-8'});
const badMachineTemplate = fs.readFileSync(path.resolve(__dirname, '../views/email_templ/badmachine.ejs'), {encoding: 'utf-8'});
const balanceTemplate = fs.readFileSync(path.resolve(__dirname, '../views/email_templ/balance.ejs'), {encoding: 'utf-8'});
let transporter;

class Email {
    constructor(props) {
        if (!CT.config.needSendEmail) {
            return;
        }
        transporter = nodemailer.createTransport({
            host: CT.config.stmp.host,
            port: CT.config.stmp.port,
            secure: CT.config.stmp.secure, // true for 465, false for other ports
            auth: CT.config.stmp.auth
        });
    }

    async sendEmailByTemplate(to, subject, data, template) {

        if (!CT.config.needSendEmail) {
            return;
        }
        let html = ejs.renderFile(template, data);
        let info = await transporter.sendMail({
            from: CT.config.stmp.sender,
            to: to,
            subject: subject,
            text: JSON.stringify(data, 2, 2),
            html: html,
        });
        return info;
    }

    /**
     *
     * @param eras {Array<Number|BigNumber|LikeNumber>}
     * @returns {Promise<unknown[]>}
     */
    async sendEraClaimed(eras) {
        if (!CT.config.needSendEmail) {
            return Promise.resolve([]);
        }
        let data = await CT.models.eraReward.findAll({eraIndex: {[CT.Sequelize.Op.in]: eras}})
        data = CT._.groupBy(data, 'ownerAddress');
        let owners = await CT.models.owner.findAll({address: {[CT.Sequelize.Op.in]: Object.keys(data)}}, {attributes: ['name', 'email', 'address']});

        let batchSend = [];
        owners.forEach(o => {
            let html = ejs.render(claimedTemplate, {
                data: data[o.address],
                owner: o
            });
            o.email && batchSend.push(transporter.sendMail({
                from: CT.config.stmp.sender,
                to: o.email,
                subject: `${o.name} ${CT.humanize.oxford(eras)} claimed!`,
                text: JSON.stringify(data, 2, 2),
                html: html,
            }));
        })
        let infos = await Promise.all(batchSend).catch(err => {
            console.error(err);
            return null;
        });
        return infos;
    }

    /**
     *
     * @param ownerEras {Object<key:ownerAddress,value:Array<Number>>}
     * @returns {Promise<unknown[]>}
     */
    async sendEraClaimedByOwner(ownerEras) {
        if (!CT.config.needSendEmail) {
            return Promise.resolve([]);
        }

        let where = {[CT.Sequelize.Op.or]: []};
        for (let k in ownerEras) {
            where[CT.Sequelize.Op.or].push({
                ownerAddress: k,
                eraIndex: ownerEras[k]
            });
        }
        let data = await CT.models.eraReward.findAll(where);
        data = CT._.groupBy(data, 'ownerAddress');
        let owners = await CT.models.owner.findAll({address: {[CT.Sequelize.Op.in]: Object.keys(data)}}, {attributes: ['name', 'email', 'address']});

        let batchSend = [];
        owners.forEach(o => {
            let html = ejs.render(claimedTemplate, {
                data: data[o.address],
                owner: o
            });
            o.email && batchSend.push(transporter.sendMail({
                from: CT.config.stmp.sender,
                to: o.email,
                subject: `${o.name} ${CT.humanize.oxford(ownerEras[o.address])} claimed!`,
                text: JSON.stringify(data, 2, 2),
                html: html,
            }));
        })
        let infos = await Promise.all(batchSend).catch(err => {
            console.error(err);
            return null;
        });
        return infos;
    }

    /**
     * @param data {Object<key:email, value:Array<Object<ownerName,ownerAddress,address,reportTime,reportSlot,memberName>>>}
     * @returns {Promise<unknown[]>}
     */
    async sendBadMachinesEmergency(data) {
        if (!CT.config.needSendEmail) {
            return Promise.resolve([]);
        }
        let emailQueue = [];
        for (let k in data) {
            let html = ejs.render(badMachineTemplate, {
                data: data[k]
            });
            emailQueue.push(transporter.sendMail({
                from: CT.config.stmp.sender,
                to: k,
                subject: `机器故障提醒！`,
                text: JSON.stringify(data[k], 2, 2),
                html: html,
            }));
        }
        let infos = await Promise.all(emailQueue).catch(err => {
            console.error(err);
            return null;
        });
        return infos;
    }

    /**
     *
     * @param balance
     * @returns {Promise<unknown[]>}
     */
    async sendBalance(address, balance, nonce) {
        if (!CT.config.needSendEmail) {
            return Promise.resolve([]);
        }
        let owner = await CT.models.owner.findOne({address: {[CT.Sequelize.Op.not]: null}}, {
            attributes: ['email'],
            throwError: false
        });

        if (!owner) {
            return Promise.resolve([]);
        }
        let html = ejs.render(balanceTemplate, {
            data: {address: address, balance: balance, nonce: nonce},
        });
        let info = transporter.sendMail({
            from: CT.config.stmp.sender,
            to: owner.email,
            subject: `reward account balance warning!`,
            text: `reward account balance warning!`,
            html: html,
        }).catch(err => {
            console.error(err);
            return null;
        });
        return info;
    }
}

module.exports = new Email();