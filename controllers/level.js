class Ctrl {
  constructor() {
  }

  async levelPage(req, res) {
    return {
      page: 'level/levels',
      data: {
        title: "等级规则"
      }
    };
  }

  async levels(req, res) {
    let data = req.data;
    data.pagination.page = data.pagination.page * 1 || 1;
    data.pagination.perpage = data.pagination.perpage * 1 || 10;

    let where = [{id: {[CT.OP.gt]: 0}}];
    if (data.query) {
      if (data.query.status) {
        where.push({status: data.query.status});
      }
    }

    let sort = [];
    if (data.sort) {
      sort.push([data.sort.field, data.sort.sort]);
    }
    let ret = await CT.models.level.findByPager(data.pagination.page, data.pagination.perpage, where, {
      attributes: ['id', 'name', 'level', 'upgradeRule', 'relegationRule', 'status', 'createdAt', 'updatedAt'],
      order: sort
    });

    // for (let i = 0; i < ret.rows.length; i++) {
    //   let row = ret.rows[i];
    //   ret.rows[i] = row;
    // }

    return {
      [CT.constants.NON_STANDARD_RET]: true,
      "meta": {
        "page": ret.page,
        "pages": ret.totalPage,
        "perpage": ret.pageSize,
        "total": ret.count,
        "sort": "asc",
      },
      rows: ret.rows
    };

  }

  async addPage(req, res) {
    return {
      page: 'level/edit-level',
      data: {isNew: 1, url: '/level', level: {}}
    }
  }

  async addLevel(req, res) {
    let data = req.data;

    let ret = await CT.models.level.create(data);
    return ret.id;
  }

  async editPage(req, res) {
    let levelId = req.params.levelId;

    let level = await CT.models.level.findOne({id: levelId}, {attributes: ['id', 'status', 'name', 'desc', 'upgradeRule', 'relegationRule', 'level']});

    return {
      page: 'level/edit-level',
      data: {isNew: 0, url: `/level/${levelId}/edit`, level}
    }
  }

  async editLevel(req, res) {

    let data = req.data;
    let levelId = parseInt(req.params.levelId);

    let ret = await CT.models.level.update({id: levelId}, data);
    return ret;
  }

  async editLevelStockPage(req, res) {
    let levelId = req.params.levelId;
    let level = await CT.models.level.findOne({id: levelId}, {attributes: ['id', 'name']});
    let levelStocks = await CT.models.levelCoupon.findAll({levelId: levelId}, {attributes: ['ccId', 'count']});
    let lsMap = {};
    let lsIds = levelStocks.map((r) => {
      lsMap[r.ccId] = r.count;
      return r.ccId;
    });
    let stocks = await CT.models.couponStock.findAll({id: lsIds}, {attributes: ['id', 'name']});
    for (let i = 0; i < stocks.length; i++) {
      stocks[i].count = lsMap[stocks[i].id];
    }
    return {
      page: 'level/level-stock',
      data: {
        title: "等级规则",
        stocks,
        name: level.name
      }
    };
  }

  async editLevelStock(req, res) {
    let levelId = req.params.levelId;

    let data = req.body;
    let rows = [];
    for (let i = 0; i < data.length; i++) {
      rows.push({
        levelId: levelId,
        count: parseInt(data[i].num) || 1,
        ccId: data[i].id,
      });
    }
    await CT.models.levelCoupon.destroy({levelId: levelId}, {throwError: false});
    let ret = await CT.models.levelCoupon.bulkCreate(rows);
    return ret.length;
  }

  async removeLevel(req, res) {

    let levelId = req.params.levelId;

    let tran = await CT.dbm.transaction();
    try {
      let ret = await CT.models.level.destroy({id: levelId}, {transaction: tran, throwError: false});
      ret = await CT.models.levelCoupon.destroy({levelId: levelId}, {transaction: tran, throwError: false});
      await tran.commit();
    }
    catch (e) {
      await tran.rollback();
      throw e;
    }

    return 1;
  }

  async updateLevelStatus(req, res) {
    let data = req.data;
    let levelId = req.params.levelId;

    let ret = await CT.models.level.update({id: levelId}, {status: data.status});
    return ret;
  }
}

Ctrl.prototype.levelPage.permitCode = '3010000';
Ctrl.prototype.levels.permitCode = '3010000';
Ctrl.prototype.addPage.permitCode = '3010100';
Ctrl.prototype.addLevel.permitCode = '3010100';
Ctrl.prototype.editPage.permitCode = '3010200';
Ctrl.prototype.editLevel.permitCode = '3010200';
Ctrl.prototype.editLevelStockPage.permitCode = '3010400';
Ctrl.prototype.editLevelStock.permitCode = '3010400';
Ctrl.prototype.removeLevel.permitCode = '3010500';
Ctrl.prototype.updateLevelStatus.permitCode = '3010300';
const that = module.exports = new Ctrl();