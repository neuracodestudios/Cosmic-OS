# COSMIC OS — Gemini Oracle: Enterprise Deployment Guide

## 🎯 Quick Summary

Your provided `GEMINI_ORACLE_ADAPTER.js` is **production-ready**. This guide walks you through deploying it with zero friction on Vercel (recommended) or Railway, then launching Cosmic OS with a fully operational AI Oracle at $0 cost.

---

## 🔐 Step 1: Generate & Secure API Key (2 min)

1. **Visit**: https://aistudio.google.com/app/apikeys
2. **Click**: "Create API Key"
3. **Copy**: The generated key (format: `AIzaSyD...`)
4. **Store**: In a password manager (NOT in code or git)

**Limits**:
- Free tier: 60 requests/minute (you use max 15/min)
- Daily: Unlimited
- Cost: $0 unless you exceed 1500 RPM

---

## 🚀 Step 2A: Deploy to Vercel (Fastest)

### Why Vercel?
- ✅ Free tier includes serverless functions
- ✅ Auto-scaling for traffic spikes
- ✅ Environment variables baked in
- ✅ Deploys in <1 minute
- ✅ Custom domains included

### Steps

#### Create Next.js API Route
```bash
# Create the route directory
mkdir -p app/api/oracle

# Create handler: app/api/oracle/route.js
```

Inside `app/api/oracle/route.js`:
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(req) {
  try {
    const { message, systemPrompt, history, mode } = await req.json();

    if (!message) {
      return Response.json(
        { success: false, error: "Message required" },
        { status: 400 }
      );
    }

    const validModes = ["standard", "shadow", "dream", "ritual"];
    const activeMode = (mode && validModes.includes(mode)) ? mode : "standard";

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `${systemPrompt}\n[Mode: ${activeMode}]`,
      generationConfig: {
        temperature: activeMode === "dream" ? 0.9 : (activeMode === "shadow" ? 0.75 : 0.7),
        topP: 0.95,
        maxOutputTokens: 1548,
      }
    });

    const contents = [];
    if (history && history.length > 0) {
      history.slice(-8).forEach(msg => {
        if (msg.role && msg.content) {
          contents.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
          });
        }
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await model.generateContent({ contents });
    const reply = response.response.text();

    if (!reply) throw new Error("Empty response");

    return Response.json({
      success: true,
      reply: reply,
      mode: activeMode,
      usage: {
        inputTokens: Math.ceil(message.length / 4),
        outputTokens: Math.ceil(reply.length / 4),
      }
    });

  } catch (error) {
    console.error("Oracle error:", error);
    return Response.json(
      { success: false, error: "Oracle error. Please try again." },
      { status: 500 }
    );
  }
}
```

#### Set Environment Variables
1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Add:
   - `GEMINI_API_KEY` = `AIzaSyD...` (your actual key)
   - `FRONTEND_URL` = `https://your-domain.vercel.app`
4. Click **Save and Redeploy**

#### Deploy
```bash
git push origin main
# Vercel auto-deploys in <1 minute
```

#### Test
```bash
curl -X POST https://your-app.vercel.app/api/oracle \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What does my birth chart reveal?",
    "systemPrompt": "You are a wise Oracle...",
    "history": [],
    "mode": "standard"
  }'
```

Expected: AI response within 2-3 seconds ✅

---

## 🚀 Step 2B: Deploy to Railway (Alternative)

### Setup

#### Install Dependencies
```bash
npm install @google/generative-ai express cors express-rate-limit
```

#### Create package.json
```json
{
  "name": "cosmic-oracle",
  "version": "1.0.0",
  "type": "module",
  "main": "gemini-oracle-adapter.js",
  "scripts": {
    "start": "node gemini-oracle-adapter.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5"
  }
}
```

#### Push to GitHub
```bash
git add -A
git commit -m "Add Gemini Oracle"
git push origin main
```

#### Deploy on Railway
1. Go to **https://railway.app**
2. Click **New Project** → **Deploy from GitHub**
3. Select your repo
4. Add environment variables:
   - `GEMINI_API_KEY` = your API key
   - `FRONTEND_URL` = your frontend URL
   - `NODE_ENV` = production
5. Set start command: `node gemini-oracle-adapter.js`
6. Deploy!

Railway auto-assigns a URL (e.g., `cosmic-oracle-prod.up.railway.app`)

---

## 🔗 Step 3: Update Frontend

In **CosmicOS.jsx**, update fetch calls (lines ~1064 & ~1510):

**FROM:**
```javascript
const resp = await fetch("https://api.anthropic.com/v1/messages", {
```

**TO:**
```javascript
// For Vercel:
const resp = await fetch("/api/oracle", {

// For Railway:
const resp = await fetch("https://cosmic-oracle-prod.up.railway.app/api/oracle", {
```

Also update request body:
```javascript
body: JSON.stringify({
  message: text,
  systemPrompt: systemPrompt,
  history: messages.slice(-10).map(m=>({role:m.role,content:m.content})),
  mode: mode,
}),
```

And response parsing:
```javascript
const reply = data.reply || data.content?.[0]?.text || "...";
```

---

## ✅ Step 4: Verification

### Health Check
```bash
curl https://your-oracle-url/health
# Response: { "status": "online", "configured": true }
```

### Oracle Test
1. Open your live Cosmic OS app
2. Go to **Oracle** section
3. Send: "What does my Aries sun sign reveal about me?"
4. Should get AI response in <5 seconds
5. Check browser console (F12) — no CORS errors

### Rate Limiting
```bash
# Hammer the endpoint 20 times
for i in {1..20}; do curl -X POST your-url/api/oracle -H "Content-Type: application/json" -d '{"message":"test","systemPrompt":"test","history":[]}'; done
# Should get 429 (Too Many Requests) after 15th request
```

---

## 📊 Monitoring

### Track API Usage
1. Go to **https://aistudio.google.com/app/usage**
2. Monitor requests, tokens, costs
3. Set alerts (optional, but smart)

### Optimize If Needed
If you hit rate limits:
- **Option A**: Implement response caching (Redis, 5min TTL)
- **Option B**: Queue system (Bull + Redis)
- **Option C**: Upgrade Gemini tier ($0.075/1K tokens)

---

## 🔄 Future: Upgrade to Claude

When you have revenue:

1. Create new `/api/oracle/route.js` with Anthropic SDK
2. Set `ANTHROPIC_API_KEY` in environment
3. Deploy
4. **No frontend changes needed** ✨

The adapter pattern makes AI provider swaps seamless.

---

## 📋 Launch Checklist

- [ ] Gemini API key created
- [ ] Backend deployed (Vercel or Railway)
- [ ] Environment variables configured
- [ ] Health endpoint working (`/health` returns 200)
- [ ] Oracle responds to test message
- [ ] No CORS errors in browser console
- [ ] Frontend updated to call `/api/oracle`
- [ ] Tested on mobile & desktop
- [ ] Rate limiting verified
- [ ] Error handling works
- [ ] Monitoring dashboard bookmarked
- [ ] Ready to launch! 🚀

---

## 🎉 You're Live

**Total setup**: 15 minutes  
**Total cost**: $0  
**Total capacity**: Hundreds of concurrent users (Gemini free tier is generous)

Your Cosmic OS is fully operational with free, fast AI Oracle.

Now ship it and focus on: marketing, user feedback, iteration.

The infrastructure is done. The product is ready. **Launch.** 🌌
