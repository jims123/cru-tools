var express = require('express');
var router = express.Router();

router.get('/', CT.co(CT.ctrls.user.indexPage));
router.post('/', CT.co(CT.ctrls.user.addUser));
router.get('/:id', CT.co(CT.ctrls.user.getUser));
router.put('/:id', CT.co(CT.ctrls.user.editUser));
router.delete('/:id', CT.co(CT.ctrls.user.delUser));

module.exports = router;
