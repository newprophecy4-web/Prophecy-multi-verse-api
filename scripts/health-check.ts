const r=await fetch(`http://localhost:${process.env.PORT??3000}/health`).catch(()=>null); console.log(r?await r.text():'FAIL backend unavailable'); process.exit(r?0:1);
