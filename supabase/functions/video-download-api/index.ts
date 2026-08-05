import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});
const textOf=(data:Record<string,unknown>)=>String(data.error??data.message??data.text??data.status??"");
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 try{
  const auth=req.headers.get("Authorization")??"";if(!auth.startsWith("Bearer "))return json({ok:false,error:"Sign in is required."},401);
  const client=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}}});
  const {data:{user},error:userError}=await client.auth.getUser();if(userError||!user)return json({ok:false,error:"Invalid session."},401);
  const body=await req.json().catch(()=>({}));const action=String(body.action??"status");const apiKey=Deno.env.get("VIDEO_DOWNLOAD_API_KEY")??"";
  if(action==="status")return json({ok:true,configured:Boolean(apiKey),message:apiKey?"Video Download API key is configured.":"Add VIDEO_DOWNLOAD_API_KEY to Supabase secrets."});
  if(!apiKey)return json({ok:false,error:"Video Download API is not configured in Supabase secrets."},503);
  if(action==="create"){
   if(!body.permissionConfirmed)return json({ok:false,error:"Permission confirmation is required."},400);
   const source=String(body.url??"").trim();if(!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(source))return json({ok:false,error:"Enter a valid YouTube URL."},400);
   const allowed=new Set(["360","720","1080","1440","mp44k","mp48k","mp3"]);const format=allowed.has(String(body.format))?String(body.format):"720";
   const params=new URLSearchParams({url:source,format,apikey:apiKey,add_info:"1",allow_extended_duration:"0",no_merge:"0"});
   if(format==="mp3")params.set("audio_quality",["128","192","256","320"].includes(String(body.audioQuality))?String(body.audioQuality):"320");
   const response=await fetch(`https://p.savenow.to/ajax/download.php?${params}`);const raw=await response.text();let data:Record<string,unknown>;try{data=JSON.parse(raw)}catch{data={text:raw}}
   if(!response.ok||data.success===0||!data.id)return json({ok:false,error:textOf(data)||`Provider returned ${response.status}.`,provider:data},502);
   const info=(data.info??{}) as Record<string,unknown>;return json({ok:true,id:String(data.id),progressUrl:String(data.progress_url??""),title:String(info.title??""),thumbnail:String(info.image??"")});
  }
  if(action==="progress"){
   const id=String(body.id??"").trim();if(!id)return json({ok:false,error:"Job ID is required."},400);
   const response=await fetch(`https://p.savenow.to/ajax/progress.php?${new URLSearchParams({id})}`);const raw=await response.text();let data:Record<string,unknown>;try{data=JSON.parse(raw)}catch{data={text:raw}}
   if(!response.ok)return json({ok:false,error:textOf(data)||`Progress endpoint returned ${response.status}.`},502);
   const progress=Number(data.progress??0),downloadUrl=String(data.download_url??"");const failed=data.success===0||/failed|error/i.test(textOf(data));
   return json({ok:true,progress,downloadUrl,success:data.success,failed,text:textOf(data),title:String(data.title??"")});
  }
  return json({ok:false,error:"Unknown action."},400);
 }catch(error){return json({ok:false,error:error instanceof Error?error.message:"Unexpected server error."},500)}
});