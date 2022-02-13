var express = require('express');
var router = express.Router();

router.get('/', CT.co(CT.ctrls.mainpage.indexPage));

module.exports = router;
