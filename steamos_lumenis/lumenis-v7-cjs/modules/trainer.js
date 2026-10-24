let state = { dodgeLeft: 0, jumpSpam: 0, attackCount: 0 };

module.exports = {
  analyze: (e) => {
    if (e === "jump") state.jumpSpam++;
    if (e === "dodge_left") state.dodgeLeft++;
    if (e === "attack") state.attackCount++;
    return state;
  },
  suggest: () => {
    if (state.jumpSpam > 5) return "Bait and punish on landing.";
    if (state.dodgeLeft > 3) return "Pressure the right flank.";
    return "Monitor. Stay resonant.";
  },
  state
};
