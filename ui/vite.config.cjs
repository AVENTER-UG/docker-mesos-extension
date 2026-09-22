const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const setupProxy = require("./src/setupProxy");

module.exports = defineConfig(({ mode }) => ({
  base: mode === "production" ? "/app/" : "/",
  plugins: [
    react({ include: /\.[jt]sx?$/ }),
    {
      name: "clusterd-proxy",
      configureServer(server) {
        setupProxy(server.middlewares);
      },
    },
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
    "process.env.REACT_APP_VERSION": JSON.stringify(process.env.REACT_APP_VERSION || "development"),
  },
  server: {
    port: 3000,
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.js$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  build: {
    outDir: "build",
    assetsDir: "static",
    emptyOutDir: true,
  },
}));
