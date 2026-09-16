import {createRouter, createWebHistory} from 'vue-router'
import SignUpPage from '../components/signup/SignUpPage.vue'
import LoginPage from '../components/login/LoginPage.vue'
import CaseSolvingPage from '../components/Medical/CaseSolvingPage.vue'
import CaseReviewPage from '../components/Medical/review/CaseReviewPage.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: '/medical?region=brain&type=CT'
        },
        {
            path: '/signup',
            component: SignUpPage
        },
        {
            path: '/login',
            component: LoginPage
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
