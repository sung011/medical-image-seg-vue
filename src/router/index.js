import {createRouter, createWebHistory} from 'vue-router'
import SignUpPage from '../components/signup/SignUpPage.vue'
import LoginPage from '../components/login/LoginPage.vue'
import CaseSolvingPage from '../components/Medical/CaseSolvingPage.vue'
import CaseReviewPage from '../components/Medical/review/CaseReviewPage.vue'
import { getUserSession } from '../components/login/authSession'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: () => (getUserSession() ? '/medical?region=brain&type=CT' : '/login')
        },
        {
            path: '/signup',
            component: SignUpPage
        },
        {
            path: '/login',
            component: LoginPage,
            beforeEnter(to, from, next) {
                if (getUserSession()) {
                    next('/medical?region=brain&type=CT')
                    return
                }
                next()
            }
        },
        {
            path: '/medical',
            component: CaseSolvingPage
        },
        {
            path: '/medical/review',
            component: CaseReviewPage
        }
    ]
})

export default router
