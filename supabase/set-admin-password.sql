-- One-off: set a password + confirm email for an existing account so you can
-- log in with email + password without going through the email-code flow.
--
-- Run this in the Supabase SQL Editor (it uses pgcrypto's crypt/gen_salt, which
-- live in the `extensions` schema on Supabase).
--
-- Account : nguyenanhduc2909@gmail.com
-- Password: Anhduc123@
--
-- After running, change the password later from the app's "Quên mật khẩu" flow
-- once Resend email is working.

do $$
declare
  v_email    text := 'nguyenanhduc2909@gmail.com';
  v_password text := 'Anhduc123@';
  v_user_id  uuid;
begin
  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    raise exception 'No auth.users row for %, sign up first then re-run.', v_email;
  end if;

  -- Set the bcrypt password hash and mark the email as confirmed.
  update auth.users
  set
    encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at         = now()
  where id = v_user_id;

  -- Ensure an email/password identity exists (accounts created via Google/magic
  -- link may only have a non-email identity). Required for password sign-in.
  if not exists (
    select 1 from auth.identities
    where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email',
      now(), now(), now()
    );
  end if;

  raise notice 'Password set and email confirmed for % (id=%)', v_email, v_user_id;
end $$;
