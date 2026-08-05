YOUTUBE SEARCH EDGE FUNCTION

1. In Supabase, open Edge Functions.
2. Create or deploy a function named:
   youtube-search
3. Replace its index.ts with the included file.
4. In Edge Function Secrets add:
   YOUTUBE_DATA_API_KEY
5. Set that secret to a YouTube Data API v3 key.
6. Deploy the function.
7. Reload Producer Hub and use the in-site YouTube search.

No SQL or RLS changes are required.
