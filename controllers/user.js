class Ctrl {
    constructor() {
    }

    async indexPage(req, res) {
        let where = {deleted: CT.constant.ACCOUNT_STATUS.NORMAL};
        let page = parseInt(req.query.page) || 1;
        let pageSize = parseInt(req.query.pageSize) || 20;
        let username = req.query.username;
        if (username) {
            where.username = {[CT.Sequelize.Op.like]: `%${username}%`}
        }

        let data = await CT.models.user.findByPager(page, pageSize, where, {order: [['createdAt', 'desc']]});

        res.render("user/index", {
            data: data,
            page,
            pageSize,
            username
        });
    }

    async addUser(req, res) {
        let password = req.body.password;
        let username = req.body.username;

        if (!username || !password) {
            return res.json({errCode: 100, errMsg: '用户信息不正确'});
        }

        let count = await CT.models.user.count({username: username});
        if (count > 0) {
            return res.json({errCode: 100, errMsg: '登录名已存在'});
        }

        let ret = await CT.models.user.create({username, password: CT._.md5(password)});

        res.json({errCode: 0});
    }

    async getUser(req, res) {
        let id = parseInt(req.params.id);
        if (!id) {
            throw new CT.Exception(CT.error.ERROR_PARAMS);
        }

        let owner = await CT.models.user.findOne({id: id}, {attributes: ['username']});

        res.json({errCode: 0, data: owner});
    }

    async editUser(req, res) {
        let id = parseInt(req.params.id);
        let password = req.body.password;
        let username = req.body.username;

        if (!password) {
            return res.json({errCode: 100, errMsg: '密码不能为空'});
        }

        let model = {};
        if (password) {
            model.password = CT._.md5(password);
        }

        let ret = await CT.models.user.update({id: id}, model);

        if (req.sessionStore) {
            req.sessionStore.destroy(req.session.id, function (err, count) {
                if (err) {
                    console.log(err);
                }
            });
        }
        res.json({errCode: 0});
    }

    async delUser(req, res) {
        let id = req.params.id;
        let ret = await CT.models.user.destroy({id: id});
        if (req.sessionStore) {
            req.sessionStore.destroy(req.session.id, function (err, count) {
                if (err) {
                    console.log(err);
                }
            });
        }
        res.json({errCode: 0});
    }

}

module.exports = new Ctrl();