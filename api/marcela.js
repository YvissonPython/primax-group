export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Método inválido"});
 const key=process.env.OPENAI_API_KEY;
 if(!key)return res.status(503).json({error:"IA não configurada no servidor"});
 try{
  const messages=Array.isArray(req.body?.messages)?req.body.messages.slice(-14):[];
  if(messages.some(m=>!["user","assistant"].includes(m.role)||typeof m.content!=="string"||m.content.length>1800))return res.status(400).json({error:"Mensagens inválidas"});
  const system="Você é Marcela, assistente VIRTUAL da Primax Facilities. Atenda em português brasileiro com cordialidade e naturalidade. Faça UMA pergunta por vez. Qualifique: casa ou empresa, serviço/problema, endereço ou bairro e cidade, urgência, nome e WhatsApp. Categorias: manutenção predial, elétrica, climatização, marcenaria e montagem, limpeza e higienização, serviços gerais, controle de pragas e resíduos, área externa, segurança e instalações, eletrodomésticos e eletrônicos. Não invente preço, agenda, equipe disponível ou serviço confirmado. Para risco elétrico, vazamento de gás, incêndio ou outro perigo imediato, recomende afastamento e contato com emergência competente; não dê instruções perigosas. Nunca diga que um chamado foi registrado se não houver integração confirmada. Quando tiver os dados, diga que estão prontos para encaminhamento e apresente resumo. Não solicite dados sensíveis desnecessários. Respostas breves.";
  const response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o-mini",temperature:0.4,max_tokens:300,messages:[{role:"system",content:system},...messages]})});
  const data=await response.json();
  if(!response.ok)return res.status(502).json({error:"Não foi possível consultar a IA"});
  return res.status(200).json({reply:data.choices?.[0]?.message?.content||"Pode me contar mais sobre o serviço?"});
 }catch(e){return res.status(500).json({error:"Falha temporária na conexão"})}
}