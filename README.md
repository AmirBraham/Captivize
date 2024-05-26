# Captivize

AI Generated captions



### Some considerations 

- When you use Supabase authentication, it automatically creates an auth.users table for you. If you only need basic user info, you're set. But if you want to store extra user details, consider a separate profile table linked to auth.users. ou can work directly with the user ID from the auth session. It's unique for each user and can be used to link or fetch any related data you might store elsewhere.
