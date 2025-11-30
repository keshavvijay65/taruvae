/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",

  images: {
    unoptimized: true,  // static export me ye zaroori hai
  },

  trailingSlash: true, // hostinger routing fix
};

module.exports = nextConfig;
