const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    historyApiFallback: {
      disableDotRule: true,
      rewrites: [
        { from: /^\/medical\/review/, to: '/index.html' }
      ]
    },
    proxy: {
      '/stylesheets': {
        target: 'http://125.134.136.59:3333',
        changeOrigin: true
      }
    }
  }
})
