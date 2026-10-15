/* Primax Group — worker de notificações push. Escopo: /crm/ */
self.addEventListener('push',event=>{
 let data={title:'Primax Group',body:'Você tem uma atualização no CRM',url:'/crm'};
 try{const payload=event.data?.json();if(payload&&typeof payload==='object')data={...data,...payload}}catch(_){if(event.data)data.body=event.data.text()}
 const target=(typeof data.url==='string'&&data.url.startsWith('/crm'))?data.url:'/crm';
 event.waitUntil(self.registration.showNotification(String(data.title).slice(0,120),{body:String(data.body).slice(0,240),icon:'/assets/primax-mark.png',badge:'/assets/primax-mark.png',tag:String(data.tag||'primax-task'),data:{url:target},renotify:false}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const target=new URL(event.notification.data?.url||'/crm',self.location.origin);
 event.waitUntil((async()=>{const clientsList=await clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clientsList){if(new URL(client.url).origin===target.origin){await client.focus();if('navigate'in client)await client.navigate(target.href);return}}await clients.openWindow(target.href)})());
});
