export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Método não permitido"});
 const key=process.env.OPENAI_API_KEY,dbkey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key||!dbkey)return res.status(503).json({error:"Integração do CRM ainda não configurada no Vercel"});
 const messages=Array.isArray(req.body?.messages)?req.body.messages.slice(-20):[];
 if(!messages.length||messages.some(m=>!["user","assistant"].includes(m.role)||typeof m.content!=="string"||m.content.length>1800))return res.status(400).json({error:"Conversa inválida"});
 try{
 const extract=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o-mini",temperature:0,response_format:{type:"json_object"},messages:[{role:"system",content:"Extraia APENAS informações explicitamente fornecidas pelo cliente nesta conversa. Responda JSON com campos name,phone,environment,category,need,location,urgency. environment: casa, empresa ou vazio. urgency: baixa,media,alta,critica. Não invente. Se nome, WhatsApp, ambiente, necessidade ou localização ausentes, deixe vazio."},...messages]})});
 if(!extract.ok)throw Error("extract_error");
 const raw=await extract.json();const d=JSON.parse(raw.choices[0].message.content);
 const name=String(d.name||"").trim().slice(0,120),phone=String(d.phone||"").replace(/\D/g,"").slice(0,20),environment=String(d.environment||""),need=String(d.need||"").trim().slice(0,1500),location=String(d.location||"").trim().slice(0,180);
 if(!name||phone.length<10||!["casa","empresa"].includes(environment)||!need||!location)return res.status(422).json({error:"Ainda faltam dados para registrar: nome, WhatsApp, casa/empresa, problema e localização."});
 const category=String(d.category||"").slice(0,100),urgency=["baixa","media","alta","critica"].includes(d.urgency)?d.urgency:"media";
 const body={name,phone,environment,city:location,category,service_interest:category,need_summary:need,urgency,origin:"marcela_ia",stage:"novo_lead",next_action:"Qualificar atendimento via Marcela IA"};
 const result=await fetch("https://rfosckpambfgyyodbfye.supabase.co/rest/v1/facilities_leads?select=id",{method:"POST",headers:{"apikey":dbkey,"Authorization":"Bearer "+dbkey,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(body)});
 const data=await result.json();if(!result.ok){console.error("CRM insert",result.status);return res.status(502).json({error:"Não foi possível registrar no CRM. Tente novamente."})}
 return res.status(201).json({ok:true,id:data[0]?.id});
 }catch(e){console.error("intake",String(e));return res.status(500).json({error:"Falha temporária no registro"})}
}