var express = require('express');
var router = express.Router();

router.get('/', CT.co(CT.ctrls.sysCfg.indexPage));
router.get('/:id', CT.co(CT.ctrls.sysCfg.getCfg));
router.post('/', CT.co(CT.ctrls.sysCfg.addCfg));
router.put('/:id', CT.co(CT.ctrls.sysCfg.editCfg));
router.delete('/:id', CT.co(CT.ctrls.sysCfg.delCfg));

module.exports = router;
