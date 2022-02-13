var express = require('express');
var router = express.Router();

router.get('/', CT.co(CT.ctrls.account.indexPage));
router.post('/', CT.co(CT.ctrls.account.batchAddAccounts));
router.delete('/', CT.co(CT.ctrls.account.delAccount));
router.put('/transfer', CT.co(CT.ctrls.account.transferAccount));
router.get('/transferfee', CT.co(CT.ctrls.account.retrieveTransfer));
router.get('/download', CT.co(CT.ctrls.account.downloadJson));

module.exports = router;
