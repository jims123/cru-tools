var express = require('express');
var router = express.Router();

router.get('/home', CT.co(CT.ctrls.sse.SSEHomePage));

module.exports = router;
