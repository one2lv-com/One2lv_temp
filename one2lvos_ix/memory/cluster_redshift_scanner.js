const fs=require("fs")
const path=require("path")

class ClusterScanner{

constructor(){

this.map=path.join(__dirname,"../vault/constellation_map.json")

}

scan(){

if(!fs.existsSync(this.map)) return []

const stars=JSON.parse(fs.readFileSync(this.map))

let drifting=[]

stars.forEach(s=>{

const d=Math.sqrt(s.x*s.x+s.y*s.y)

if(d>0.8) drifting.push(s)

})

return drifting

}

}

module.exports=ClusterScanner
