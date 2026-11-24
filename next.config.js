/** @type {import('next').NextConfig} */
module.exports={serverExternalPackages:['@prisma/client','bcryptjs','cloudinary','exceljs'],images:{remotePatterns:[{protocol:'https',hostname:'res.cloudinary.com'},{protocol:'https',hostname:'*.supabase.co'}]}};
