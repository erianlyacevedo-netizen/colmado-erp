import type { NextConfig } from 'next';
const config: NextConfig={serverExternalPackages:['@prisma/client','bcryptjs','cloudinary','exceljs'],images:{remotePatterns:[{protocol:'https',hostname:'res.cloudinary.com'},{protocol:'https',hostname:'*.supabase.co'}]}};
export default config;
