import {createRouter, createWebHistory} from 'vue-router'
import SignUpPage from '../components/signup/SignUpPage.vue'
import LoginPage from '../components/login/LoginPage.vue'
import CaseSolvingPage from '../components/Medical/CaseSolvingPage.vue'
import CaseReviewPage from '../components/Medical/review/CaseReviewPage.vue'
import indexPage from '../components/main/indexPage.vue'
import LearningSetupPage from '../components/learning/LearningSetupPage.vue'
import ScreenAnalyzePage from '../components/analyze/ScreenAnalyzePage.vue'
import WrongNotePage from '../components/note/WrongNotePage.vue'
import LearningHistoryPage from '../components/history/LearningHistoryPage.vue'
import GlossaryPage from '../components/glossary/GlossaryPage.vue'
import {getUserSession} from '../components/login/authSession'

function requireSession(to, from, next) {
    if (!getUserSession()) {
        next('/login')
        return
    }
    next()
}

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: () => (getUserSession() ? '/main' : '/login')
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
                    next('/main')
                    return
                }
                next()
            }
        },
        {
            path: '/medical',
            component: CaseSolvingPage,
            beforeEnter: requireSession
        },
        {
            path: '/medical/review',
            component: CaseReviewPage,
            beforeEnter: requireSession
        },
        {
            path: '/main',
            component: indexPage,
            beforeEnter: requireSession
        },
        {
            path: '/learning',
            component: LearningSetupPage,
            beforeEnter: requireSession
        },
        {
            path: '/analyze',
            component: ScreenAnalyzePage,
            beforeEnter: requireSession
        },
        {
            path: '/note',
            component: WrongNotePage,
            beforeEnter: requireSession
        },
        {
            path: '/history',
            component: LearningHistoryPage,
            beforeEnter: requireSession
        },
        {
            path: '/glossary',
            component: GlossaryPage,
            beforeEnter: requireSession
        }
    ]
})

export default router
