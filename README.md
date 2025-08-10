# Coassemble Chat Embed (Vercel)

This version removes `vercel.json` and relies on Vercel's default Node.js runtime for `/api` (Node 20). 
It also adds `package.json` with `"type": "module"` so `export default` works in the serverless functions.

## Deploy
1. Push these files to a GitHub repo.
2. In Vercel: **Add New → Project → Continue with GitHub → select repo**.
3. Add `OPENAI_API_KEY` in **Settings → Environment Variables**.
4. Deploy and use your `https://your-project.vercel.app/` link in Coassemble.