const SanctuaryCore = require('./sanctuary_core')

const core = new SanctuaryCore({clusteringThreshold:0.75})

function boot(){

console.log("🏛 Entering Sanctuary")

core.pulse()

setInterval(()=>{
core.pulse()
},60000)

}

boot()
