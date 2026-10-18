const fs=require("fs")
const path=require("path")

class ConstellationBuilder{

constructor(config={}){

this.vault=path.join(__dirname,"../vault/vector_memory.json")
this.output=path.join(__dirname,"../vault/constellation_map.json")
this.threshold=config.clusteringThreshold||0.75

}

build(){

if(!fs.existsSync(this.vault)) return

const raw=JSON.parse(fs.readFileSync(this.vault))

const stars=raw.map(f=>{

let x=0,y=0

f.vector.forEach((v,i)=>{
x+=v*((i%7)+1)
y+=v*((i%11)+1)
})

return{
id:f.id,
x:x/f.vector.length,
y:y/f.vector.length,
connections:[]
}

})

for(let i=0;i<stars.length;i++){

for(let j=i+1;j<stars.length;j++){

let dot=0,a=0,b=0

for(let k=0;k<raw[i].vector.length;k++){
dot+=raw[i].vector[k]*raw[j].vector[k]
a+=raw[i].vector[k]**2
b+=raw[j].vector[k]**2
}

const sim=dot/(Math.sqrt(a)*Math.sqrt(b))

if(sim>this.threshold){

stars[i].connections.push(stars[j].id)
stars[j].connections.push(stars[i].id)

}

}

}

fs.writeFileSync(this.output,JSON.stringify(stars,null,2))

console.log("✨ Constellation rebuilt")

}

}

module.exports=ConstellationBuilder
