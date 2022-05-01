module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/:slug*",
        destination: "https://messenger-api.tung.ninja/api/:slug*",
      },
    ];
  },
};
