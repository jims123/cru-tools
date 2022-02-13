var express = require('express');
var router = express.Router();

router.get('/',  CT.co(CT.ctrls.reward.indexPage));
router.delete('/',  CT.co(CT.ctrls.reward.delLog));
router.post('/email',  CT.co(CT.ctrls.reward.sendEmail));

module.exports = router;
