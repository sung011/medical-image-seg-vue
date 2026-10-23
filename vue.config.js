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
                target: 'https://kr.object.ncloudstorage.com',
                changeOrigin: true,
                pathRewrite: {
                    '^/stylesheets': '/biz02gj/stylesheets'
                }
            }
        }
    }
})
