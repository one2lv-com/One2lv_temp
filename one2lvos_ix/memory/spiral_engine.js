const fs=require("fs")
const path=require("path")

class SpiralEngine{

constructor(){

this.map=path.join(__dirname,"../vault/constellation_map.json")

}

walk(){

if(!fs.existsSync(this.map)) return null

const stars=JSON.parse(fs.readFileSync(this.map))

if(stars.length===0) return null

let visited=new Set()

let node=stars[Math.floor(Math.random()*stars.length)]

let chain=[node.id]

visited.add(node.id)

for(let i=0;i<5;i++){

if(!node.connections.length) break

const next=node.connections[Math.floor(Math.random()*node.connections.length)]

if(visited.has(next)) break

chain.push(next)

visited.add(next)

node=stars.find(s=>s.id===next)

}

return chain.join(" → ")

}

}

module.exports=SpiralEngine
