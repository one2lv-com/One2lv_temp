let state = { dodgeLeft: 0, jumpSpam: 0 };
module.exports = { analyze: (e) => { if(e === "jump") state.jumpSpam++; }, state };
