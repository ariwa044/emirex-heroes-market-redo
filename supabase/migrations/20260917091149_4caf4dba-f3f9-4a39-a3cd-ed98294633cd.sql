ALTER TABLE public.profiles
  ADD COLUMN username text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format CHECK (
    username IS NULL OR username ~ '^[A-Za-z0-9_.]{3,30}$'
  ),
  ADD CONSTRAINT profiles_display_name_length CHECK (char_length(display_name) <= 100);

CREATE UNIQUE INDEX profiles_username_unique_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;