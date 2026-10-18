const http=require("http")
const fs=require("fs")
const path=require("path")

const PORT=8080

http.createServer((req,res)=>{

if(req.url=="/api/constellation"){

const data=fs.readFileSync("./vault/constellation_map.json")

res.writeHead(200,{"Content-Type":"application/json"})
res.end(data)
return

}

if(req.url=="/atlas_engine.js"){

res.writeHead(200,{"Content-Type":"application/javascript"})
res.end(fs.readFileSync("./dashboard/atlas_engine.js"))
return

}

res.writeHead(200,{"Content-Type":"text/html"})
res.end(fs.readFileSync("./dashboard/index.html"))

}).listen(PORT,()=>{

console.log("🌌 Atlas running http://localhost:"+PORT)

})
