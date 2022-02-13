class Ctrl {
    constructor() {
    }

    async indexPage(req, res) {

        let name = req.query.name || '';

        let where = {};
        if (name) {
            where.keyName = {[CT.Sequelize.Op.like]: `%${name}%`};
        }
        let data = await CT.models.sysCfg.findAll(where);
        res.render("syscfg/index", {
            data: data,
            name
        });
    }

    async addCfg(req, res) {
        let name = req.body.name;
        let value = req.body.value;
        let desc = req.body.desc;
        let type = req.body.type;

        let mem = await CT.models.sysCfg.create({
            keyName: name,
            keyValue: value,
            keyType: type,
            keyDesc: desc,
        });

        res.json({errCode: 0});
    }

    async editCfg(req, res) {
        let id = parseInt(req.params.id);
        let name = req.body.name;
        let value = req.body.value;
        let desc = req.body.desc;
        let type = req.body.type;

        if (!id) {
            throw new CT.Exception(CT.error.ERROR_PARAMS);
        }

        let mem = await CT.models.sysCfg.update({id: id}, {
            keyName: name,
            keyValue: value,
            keyType: type,
            keyDesc: desc,
        });

        res.json({errCode: 0});
    }

    async getCfg(req, res) {
        let id = parseInt(req.params.id);
        if (!id) {
            throw new CT.Exception(CT.error.ERROR_PARAMS);
        }

        let cfg = await CT.models.sysCfg.findOne({id: id}, {attributes: ['keyName', 'keyValue', 'keyType', 'keyDesc']});

        res.json({errCode: 0, data: cfg});
    }

    async delCfg(req, res) {
        let id = req.params.id;
        let ret = await CT.models.sysCfg.destroy({id: id});
        res.json({errCode: 0});
    }
}

module.exports = new Ctrl();