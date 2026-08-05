# Video Download API Edge Function

Create an account and API key at `https://video-download-api.com/`, then set the key and deploy:

```bash
supabase secrets set VIDEO_DOWNLOAD_API_KEY="YOUR_KEY"
supabase functions deploy video-download-api
```

The function implements the documented workflow:

1. `GET https://p.savenow.to/ajax/download.php` with `url`, `format`, `apikey`, and optional MP3 bitrate.
2. Poll `GET https://p.savenow.to/ajax/progress.php?id=JOB_ID`.
3. Stop when `progress=1000` and `download_url` is present.

The key stays server-side. Production jobs may require wallet balance.
