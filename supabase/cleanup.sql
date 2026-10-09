-- Enable pg_cron, pg_net and Vault in Supabase first.
-- Create two secrets in Vault, using the dashboard (do not commit their values):
-- wedly_site_url = https://wedly-sepia.vercel.app
-- wedly_cron_secret = the same random value as Vercel CRON_SECRET
-- Access to originals expires at 48h. Physical deletion is attempted every 5 min.
-- Failed storage deletions are retried; metadata is marked deleted only on success.
select cron.schedule('wedly-expired-images','*/5 * * * *', $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name='wedly_site_url')||'/api/cleanup',
    headers := jsonb_build_object('Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='wedly_cron_secret')),
    timeout_milliseconds := 60000
  );
$$);
