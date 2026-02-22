/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://*.wesmun.com https://flask-bank.vercel.app",
                            "style-src 'self' 'unsafe-inline' https: http:",
                            "img-src 'self' data: https: http:",
                            "font-src 'self' data: https: http:",
                            "connect-src 'self' https: http:",
                            "frame-src 'self' https: http: data: blob:",
                            "media-src 'self' https: http:",
                            "object-src 'none'",
                            "base-uri *",
                            "form-action 'self'",
                            "frame-ancestors 'self'",
                        ].join('; '),
                    },
                ],
            },
        ]
    },
}

export default nextConfig
