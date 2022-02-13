var express = require('express');
var router = express.Router();

router.get('/', CT.co(CT.ctrls.member.indexPage));
router.post('/', CT.co(CT.ctrls.member.addMember));
router.get('/:id', CT.co(CT.ctrls.member.getMember));
router.put('/:id', CT.co(CT.ctrls.member.editMember));
router.post('/owner', CT.co(CT.ctrls.member.addOwner));
router.delete('/', CT.co(CT.ctrls.member.delMember));
router.get('/:id/reports', CT.co(CT.ctrls.member.reportList));
router.put('/:id/reports', CT.co(CT.ctrls.member.fillReportList));

module.exports = router;
