type ServiceAccount={project_id:string;client_email:string;private_key:string};
const API_SCOPE="https://www.googleapis.com/auth/firebase.messaging";
function b64url(bytes:Uint8Array){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"")}
const encoder=new TextEncoder();
async function firebaseToken(sa:ServiceAccount){
 const now=Math.floor(Date.now()/1000);
 const header=b64url(encoder.encode(JSON.stringify({alg:"RS256",typ:"JWT"})));
 const payload=b64url(encoder.encode(JSON.stringify({iss:sa.client_email,scope:API_SCOPE,aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3400})));
 const keyData=Uint8Array.from(atob(sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,"")),x=>x.charCodeAt(0));
 const key=await crypto.subtle.importKey("pkcs8",keyData,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
 const signature=new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,encoder.encode(header+"."+payload)));
 const assertion=header+"."+payload+"."+b64url(signature);
 const resp=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion})});
 if(!resp.ok)throw new Error("Firebase OAuth unavailable "+resp.status);
 const json=await resp.json();
 if(typeof json.access_token!=="string")throw new Error("Missing OAuth token");
 return json.access_token as string;
}
import {createClient} from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, x-client-info, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(d:unknown,status=200)=>Response.json(d,{status,headers:cors});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 if(req.method!=="POST")return reply({error:"Method"},405);
 const url=Deno.env.get("SUPABASE_URL"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!secret)return reply({error:"Unavailable"},503);
 const auth=req.headers.get("authorization")?.replace(/^Bearer /i,"");
 if(!auth)return reply({error:"Unauthorized"},401);
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await db.auth.getUser(auth);
 if(error||!user)return reply({error:"Unauthorized"},401);
 let id:string;try{id=(await req.json()).id;if(!/^[a-f0-9-]{36}$/i.test(id))throw Error()}catch{return reply({error:"Invalid request"},400)}
 const {data:target,error:prepareError}=await db.rpc("moymir_wake_prepare_native",{p_id:id,p_parent:user.id});
 if(prepareError)return reply({error:"Prepare failed"},500);
 if(!target)return reply({delivery:"foreground"});
 try{
 let raw=Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
 if(!raw){const {data:file,error:e}=await db.storage.from("moymir-server-private").download("fcm/service-account.json");if(e||!file)throw Error("Firebase credentials unavailable");raw=await file.text()}
 const sa=JSON.parse(raw) as ServiceAccount;
 const access=await firebaseToken(sa);
 const ttl=Math.max(0,Math.floor((Number(target.expires)-Date.now())/1000));
 if(ttl<1)throw Error("Expired");
 const msg={message:{token:target.token,data:{kind:"remote_wake",request_id:id,request_key:target.key,child_id:target.child,device_id:target.device,expires_at:String(Math.floor(Number(target.expires)))},android:{priority:"high",ttl:ttl+"s",restricted_package_name:"com.moymir.adventure"}}};
 const sent=await fetch("https://fcm.googleapis.com/v1/projects/"+encodeURIComponent(sa.project_id)+"/messages:send",{method:"POST",headers:{Authorization:"Bearer "+access,"Content-Type":"application/json"},body:JSON.stringify(msg)});
 if(!sent.ok)throw Error("FCM "+sent.status);
 return reply({delivery:"firebase"});
 }catch(e){await db.rpc("moymir_wake_native_failed",{p_id:id,p_key:target.key});return reply({delivery:"foreground",warning:"Background delivery unavailable"});}
});
