const ConstellationBuilder = require('./memory/constellation_builder')
const ClusterScanner = require('./memory/cluster_redshift_scanner')
const SpiralEngine = require('./memory/spiral_engine')

class SanctuaryCore {

constructor(config){
this.builder = new ConstellationBuilder(config)
this.scanner = new ClusterScanner()
this.spiral = new SpiralEngine()
}

pulse(){

console.log("🌌 Sanctuary Pulse")

this.builder.build()

const drifting = this.scanner.scan()

if(drifting.length){
console.log("🌠 Redshift clusters detected")
}

const insight = this.spiral.walk()

if(insight){
console.log("🧠 Spiral Insight:", insight)
}

}

}

module.exports = SanctuaryCore
