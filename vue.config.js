const {defineConfig} = require('@vue/cli-service')
module.exports = defineConfig({
    transpileDependencies: true,
    devServer: {
        historyApiFallback: {
            disableDotRule: true,
            rewrites: [
                {from: /^\/medical\/review/, to: '/index.html'}
            ]
        },
        proxy: {
            '/stylesheets': {
                target: 'https://olleh7531.synology.me',
                changeOrigin: true,
                pathRewrite: {
                    '^/stylesheets': '/mu_shop/public/stylesheets'
                }
            }
        }
    }
})
