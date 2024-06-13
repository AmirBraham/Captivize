//In the code snippet above, we define a rewrite rule that redirects any request matching the pattern /api/:path* to a specific destination. During development, the destination is set to http://127.0.0.1:8000/api/:path*, which means that API requests will be forwarded to a FastAPI server running locally. In a production environment, the destination is set to “/api/”, indicating that API requests will be proxied to the same domain as the Next.js app.


const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'logos-world.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mlgnxubgmzngsecafkgr.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
