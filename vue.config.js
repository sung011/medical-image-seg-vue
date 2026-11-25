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
            '/__api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                pathRewrite: {
                    '^/__api': ''
                },
                cookieDomainRewrite: ''
            },
            '/stylesheets': {
                target: 'https://kr.object.ncloudstorage.com',
                changeOrigin: true,
                pathRewrite: {
                    '^/stylesheets': '/biz02gj/stylesheets'
                }
            }
        }
    }
})
