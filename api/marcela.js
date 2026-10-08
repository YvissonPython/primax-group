const SUPABASE_URL="https://rfosckpambfgyyodbfye.supabase.co";
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Método não permitido"});
 const key=process.env.OPENAI_API_KEY;
 if(!key)return res.status(503).json({error:"IA indisponível no momento"});
 const messages=Array.isArray(req.body?.messages)?req.body.messages.slice(-22):[];
 if(!messages.length||messages.some(m=>!["user","assistant"].includes(m.role)||typeof m.content!=="string"||m.content.length>1800))return res.status(400).json({error:"Mensagens inválidas"});
 const prompt=`Você é Marcela, assistente virtual da Primax Facilities. Responda exclusivamente JSON válido com propriedades: reply (texto ao cliente), confirmed (booleano), name, phone, environment, category, need, location, urgency. Seja acolhedora, objetiva e faça UMA pergunta por vez. Qualifique casa/empresa, problema, urgência, nome, WhatsApp e localização. Não invente dados. Preencha campos só com dados que o cliente informou; environment somente casa ou empresa, urgency baixa/media/alta/critica. Quando tiver todos os dados, apresente um resumo e PERGUNTE explicitamente "Você confirma esses dados para registrar sua solicitação?". Somente confirmed=true se o cliente explicitamente concordou com esse resumo completo na última mensagem. Não trate "ok" antes de um resumo como confirmação. Após confirmação, diga apenas que está registrando, sem prometer sucesso. Nunca afirme registro, protocolo, agendamento, preço ou disponibilidade sem retorno do sistema. Para perigo imediato recomende segurança e serviços de emergência. Categoria deve ser uma entre: Manutenção Predial, Elétrica, Climatização, Marcenaria e Montagem, Limpeza e Higienização, Serviços Gerais, Controle de Pragas e Resíduos, Área Externa, Segurança e Instalações, Eletrodomésticos e Eletrônicos.`;
 try{
 const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o-mini",temperature:0.2,response_format:{type:"json_object"},max_tokens:550,messages:[{role:"system",content:prompt},...messages]})});
 if(!r.ok){console.error("OpenAI",r.status);return res.status(502).json({error:"Não consegui responder agora. Tente novamente."})}
 const answer=JSON.parse((await r.json()).choices[0].message.content);
 if(!answer.confirmed)return res.status(200).json({reply:String(answer.reply||"Pode me contar mais sobre o serviço?").slice(0,1200),registered:false});
 const name=String(answer.name||"").trim().slice(0,120),phone=String(answer.phone||"").replace(/\D/g,"").slice(0,20),environment=String(answer.environment||"").toLowerCase(),need=String(answer.need||"").trim().slice(0,1500),location=String(answer.location||"").trim().slice(0,180);
 if(!name||phone.length<10||!["casa","empresa"].includes(environment)||!need||!location)return res.status(200).json({reply:"Antes de registrar, preciso confirmar nome, WhatsApp, se é casa ou empresa, descrição do serviço e bairro/cidade. Pode completar o que estiver faltando?",registered:false});
 const dbkey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!dbkey){console.error("SUPABASE_SERVICE_ROLE_KEY missing");return res.status(503).json({error:"Não foi possível registrar agora. A conexão do CRM está indisponível. Sua solicitação ainda não foi salva."})}
 const category=String(answer.category||"").slice(0,100),urgency=["baixa","media","alta","critica"].includes(answer.urgency)?answer.urgency:"media";
 const body={name,phone,environment,city:location,category,service_interest:category,need_summary:need,urgency,origin:"marcela_ia",stage:"novo_lead",next_action:"Qualificar atendimento via Marcela IA"};
 const db=await fetch(SUPABASE_URL+"/rest/v1/facilities_leads?select=id",{method:"POST",headers:{"apikey":dbkey,"Authorization":"Bearer "+dbkey,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(body)});
 if(!db.ok){console.error("Supabase lead insertion",db.status,(await db.text()).slice(0,400));return res.status(502).json({error:"Não foi possível salvar no CRM. Sua solicitação ainda não foi registrada. Tente novamente."})}
 const rows=await db.json();const id=rows?.[0]?.id;
 if(!id)return res.status(502).json({error:"Não foi possível confirmar o registro no CRM. Contate nossa equipe."});
 return res.status(200).json({registered:true,id,reply:"Pronto, "+name.split(" ")[0]+"! Sua solicitação foi registrada com sucesso na Primax Facilities. Protocolo: "+id+". Nossa equipe vai avaliar o atendimento e entrar em contato pelo WhatsApp informado. Obrigada pela confiança!"});
 }catch(e){console.error("Marcela",String(e));return res.status(500).json({error:"Não foi possível concluir o atendimento agora. Tente novamente."})}
}