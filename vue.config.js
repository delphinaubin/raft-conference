module.exports = {
  lintOnSave: false,
  css: {
    loaderOptions: {
      less: {
        // If you are using less-loader@5 please spread the lessOptions to options directly
        modifyVars: {
          "primary-color": "DarkGoldenRod",
          "font-family":
            "Bitter, 'Roboto Slab', Cormorant, Taviraj, 'Josefin Slab', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB','Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Apple Color Emoji','Segoe UI Emoji', 'Segoe UI Symbol';",
          "body-background": "#121424",
        },
        javascriptEnabled: true,
      },
    },
  },
};
