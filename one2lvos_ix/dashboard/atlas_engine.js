const canvas=document.getElementById("galaxy")
const ctx=canvas.getContext("2d")

canvas.width=window.innerWidth
canvas.height=window.innerHeight

let cam={x:canvas.width/2,y:canvas.height/2,zoom:1}
let stars=[]
let index={}

async function load(){

const r=await fetch("/api/constellation")
stars=await r.json()

stars.forEach(s=>index[s.id]=s)

render()

}

function render(){

ctx.fillStyle="#050510"
ctx.fillRect(0,0,canvas.width,canvas.height)

ctx.save()

ctx.translate(cam.x,cam.y)
ctx.scale(cam.zoom,cam.zoom)

stars.forEach(s=>{

s.connections.forEach(id=>{

const t=index[id]
if(!t) return

ctx.strokeStyle="rgba(120,150,255,0.15)"
ctx.beginPath()
ctx.moveTo(s.x*500,s.y*500)
ctx.lineTo(t.x*500,t.y*500)
ctx.stroke()

})

})

stars.forEach(s=>{

ctx.fillStyle="#88aaff"
ctx.beginPath()
ctx.arc(s.x*500,s.y*500,3/cam.zoom,0,Math.PI*2)
ctx.fill()

})

ctx.restore()

}

canvas.addEventListener("wheel",e=>{
cam.zoom*=e.deltaY>0?0.9:1.1
render()
})

load()
