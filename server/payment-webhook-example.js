import express from "express";
import Stripe from "stripe";
const app=express(), stripe=new Stripe(process.env.STRIPE_SECRET_KEY||"");
app.post("/api/webhooks/stripe",express.raw({type:"application/json"}),(req,res)=>{
  let event; try{event=stripe.webhooks.constructEvent(req.body,req.headers["stripe-signature"],process.env.STRIPE_WEBHOOK_SECRET)}catch(e){return res.status(400).send("Invalid signature")}
  if(event.type==="checkout.session.completed"){const session=event.data.object; const userId=session.metadata?.userId; const product=session.metadata?.productId;
    // TODO: perform an idempotent database transaction using event.id.
    // If product === process.env.VIP_PRODUCT_ID, set paidMember=true. Otherwise create a song entitlement.
    console.log("Verified purchase",{eventId:event.id,userId,product});
  }
  res.json({received:true});
});
app.listen(process.env.PORT||8787,()=>console.log("Webhook starter listening"));
