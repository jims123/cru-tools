let CryptoJS = require('../public/js/crypto-js.js');

class Ctrl {
    constructor() {
    }

    async pageLogin(req, res) {
        let key = CT._.randStr(64, 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPZXCVBNMASDFGHJKL1234567890');
        res.render('login', {aesKey: key});
    }

    async login(req, res) {
        let data = req.body;

        let username = data.username;
        let password = data.password;
        if (!password) {
            throw new CT.Exception(CT.error.ERROR_USERNAMEORPASSWORD);
        }
        let user = await CT.models.user.findOne({password: password, username: username}, {
            throwError: false,
            attributes: ['id', 'username']
        });
        if (!user) {
            throw new CT.Exception(CT.error.ERROR_USERNAMEORPASSWORD);
        }

        // if (req.sessionStore) {
        //     req.sessionStore.destroy(req.sessionId, function (err, count) {
        //         if (err) {
        //             console.error(err);
        //         }
        //     });
        // }

        req.session.data = user;

        await CT.models.user.update({id: user.id}, {lastLoginTime: CT.moment().unix()});

        res.json({errCode: 0});
    }

    async logout(req, res) {
        let sessionId = req.sessionID;

        if (req.session) {
            req.session.destroy();
        }
        res.clearCookie(CT.config.SessionName);

        res.redirect(301, '/login');
    }

}

module.exports = new Ctrl();