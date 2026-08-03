# Seeker Of SoundZ v4.12.0 — Real Supabase Authentication

This build connects the existing Members interface to Supabase Auth.

## Included
- Real email/password registration
- Username and display-name metadata
- Email confirmation redirect to members.html
- Real login and logout
- Persistent Supabase sessions
- Password-reset email and password-update screen
- Automatic profile loading from public.profiles
- Supabase avatar uploads to the avatars bucket
- Secure Owner/Administrator front-end Admin Hub gate
- Compatibility bridge for existing website modules that read SOS.getSession()

## Required Supabase URLs
Site URL: https://seeker-of-soundz.github.io/seeker-of-soundz/
Redirect URL: https://seeker-of-soundz.github.io/seeker-of-soundz/members.html
Redirect wildcard: https://seeker-of-soundz.github.io/seeker-of-soundz/**

## Owner promotion
After registering and confirming your own account, run the owner promotion SQL supplied separately. Never make Owner selectable during registration.
