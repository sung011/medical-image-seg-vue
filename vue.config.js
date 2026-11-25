const {defineConfig} = require('@vue/cli-service')
const {createAccountProxy} = require('./devserver/accountProxy')

// 계정 API(마이페이지·설정·로그인) 같은 출처 프록시 대상. npm run serve 에서만 쓴다.
// 브라우저가 쓰는 백엔드(src/apiBase.js 의 API_BASE)와 같은 서버여야 한다. 다른 서버로 시험할 때만 환경값으로 바꾼다.
// 예) ACCOUNT_PROXY_TARGET=http://127.0.0.1:8012 VUE_APP_API_BASE=http://127.0.0.1:8012 npm run serve
const accountProxyTarget = process.env.ACCOUNT_PROXY_TARGET || 'http://127.0.0.1:8000'
// 화면이 로그인 전에 두 주소가 같은 서버인지 확인할 수 있게 넘긴다(비밀값이 아니라 주소만).
process.env.VUE_APP_ACCOUNT_UPSTREAM = accountProxyTarget
// 같은 서버를 다른 주소로 부를 때만: 브라우저 API 주소(origin)를 쉼표로 적어 같은 서버임을 밝힌다. 기본은 없음(완전 일치만 허용).
process.env.VUE_APP_ACCOUNT_API_ALIASES = process.env.ACCOUNT_API_ALIASES || ''

module.exports = defineConfig({
    transpileDependencies: true,
    devServer: {
        // /account-api 는 SPA 폴백·다른 프록시보다 먼저, 승인된 일곱 조합만 백엔드로 넘긴다(devserver/accountProxy.js).
        setupMiddlewares(middlewares) {
            middlewares.unshift({name: 'account-api', middleware: createAccountProxy(accountProxyTarget)})
            return middlewares
        },
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
