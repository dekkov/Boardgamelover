-- Temporarily disable the auto-profile trigger that's causing signup failures
-- We'll handle profile creation manually in the application code

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function (we can recreate it later if needed)
DROP FUNCTION IF EXISTS handle_new_user();

-- Note: Profile creation is now handled in src/hooks/useAuth.ts signUp function
