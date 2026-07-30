import "dotenv/config";
import express from "express";
import Stripe from "stripe";
import mysql from "mysql2/promise";

const app=express();
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY||"");
const pool=mysql.createPool({
  host:process.env.DB_HOST,
  port:Number(process.env.DB_PORT||3306),
  user:process.env.DB_USER,
  password:process.env.DB_PASSWORD,
  database:process.env.DB_NAME,
  connectionLimit:5,
  ssl:process.env.DB_SSL==="true"?{}:undefined
});
const siteUrl=(process.env.PUBLIC_SITE_URL||"http://127.0.0.1:5500").replace(/\/$/,"");

app.use((req,res,next)=>{
  const allowed=(process.env.ALLOWED_ORIGINS||siteUrl).split(",").map(x=>x.trim());
  const origin=req.headers.origin;
  if(origin&&allowed.includes(origin)){
    res.setHeader("Access-Control-Allow-Origin",origin);
    res.setHeader("Vary","Origin");
    res.setHeader("Access-Control-Allow-Credentials","true");
  }
  res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization, X-Demo-User-Id");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  if(req.method==="OPTIONS")return res.sendStatus(204);
  next();
});

// Stripe requires the unmodified request body for signature verification.
app.post("/api/webhooks/stripe",express.raw({type:"application/json"}),async(req,res)=>{
  let event;
  try{event=stripe.webhooks.constructEvent(req.body,req.headers["stripe-signature"],process.env.STRIPE_WEBHOOK_SECRET)}
  catch(error){return res.status(400).send(`Invalid Stripe signature: ${error.message}`)}
  try{
    const [seen]=await pool.execute("SELECT stripe_event_id FROM payment_events WHERE stripe_event_id=? LIMIT 1",[event.id]);
    if(seen.length)return res.json({received:true,duplicate:true});
    await pool.execute("INSERT INTO payment_events (stripe_event_id,event_type) VALUES (?,?)",[event.id,event.type]);
    const object=event.data.object;
    const userId=object.metadata?.userId||object.client_reference_id;
    if(userId&&event.type==="checkout.session.completed"){
      const paid=object.payment_status==="paid"||object.mode==="subscription";
      if(paid)await setVip(userId,true,"stripe",object.customer||null,object.subscription||null);
    }
    if(userId&&["customer.subscription.deleted","customer.subscription.paused"].includes(event.type)){
      await setVip(userId,false,"stripe",object.customer||null,object.id||null);
    }
    if(userId&&event.type==="customer.subscription.updated"){
      const active=["active","trialing"].includes(object.status);
      await setVip(userId,active,"stripe",object.customer||null,object.id||null);
    }
    res.json({received:true});
  }catch(error){console.error(error);res.status(500).json({error:"Webhook processing failed"})}
});

app.use(express.json({limit:"200kb"}));

// Replace this development identity resolver with real authentication before production.
// Recommended: validate a Supabase/Auth0/Firebase JWT and set req.auth.userId.
function requireUser(req,res,next){
  const authUserId=req.auth?.userId;
  const previewAllowed=process.env.ALLOW_LOCAL_PREVIEW_IDENTITIES==="true";
  const previewId=previewAllowed?req.get("X-Demo-User-Id"):null;
  const userId=authUserId||previewId;
  if(!userId)return res.status(401).json({error:"Authenticated member identity required"});
  req.userId=String(userId);next();
}

app.post("/api/checkout/vip",requireUser,async(req,res)=>{
  try{
    const mode=process.env.STRIPE_VIP_MODE==="payment"?"payment":"subscription";
    const checkout=await stripe.checkout.sessions.create({
      mode,
      line_items:[{price:process.env.STRIPE_VIP_PRICE_ID,quantity:1}],
      customer_email:req.body.email||undefined,
      client_reference_id:req.userId,
      metadata:{userId:req.userId,productType:"vip-membership"},
      success_url:`${siteUrl}/music.html?vip=success&session_id={CHECKOUT_SESSION_ID}#vipMembership`,
      cancel_url:`${siteUrl}/music.html?vip=cancelled#vipMembership`,
      allow_promotion_codes:true
    });
    res.json({url:checkout.url});
  }catch(error){console.error(error);res.status(500).json({error:"Could not create VIP checkout session"})}
});

app.get("/api/membership/status",requireUser,async(req,res)=>{
  try{
    const [rows]=await pool.execute("SELECT vip_active,vip_status,vip_updated_at FROM member_profiles WHERE user_id=? LIMIT 1",[req.userId]);
    const row=rows[0]||{};
    res.json({vipActive:!!row.vip_active,status:row.vip_status||"inactive",updatedAt:row.vip_updated_at||null});
  }catch(error){console.error(error);res.status(500).json({error:"Could not read membership status"})}
});

async function setVip(userId,active,source,customerId,subscriptionId){
  await pool.execute(`INSERT INTO member_profiles (user_id,vip_active,vip_status,vip_source,stripe_customer_id,stripe_subscription_id,vip_updated_at)
    VALUES (?,?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE vip_active=VALUES(vip_active),vip_status=VALUES(vip_status),vip_source=VALUES(vip_source),stripe_customer_id=COALESCE(VALUES(stripe_customer_id),stripe_customer_id),stripe_subscription_id=COALESCE(VALUES(stripe_subscription_id),stripe_subscription_id),vip_updated_at=NOW()`,
    [userId,active?1:0,active?"active":"inactive",source,customerId,subscriptionId]);
}

app.get("/health",(req,res)=>res.json({ok:true}));
app.listen(Number(process.env.PORT||8787),()=>console.log(`Membership server listening on ${process.env.PORT||8787}`));
