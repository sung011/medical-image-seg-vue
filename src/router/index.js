import {createRouter, createWebHistory} from 'vue-router'
import SignUpPage from '../components/signup/SignUpPage.vue'
import LoginPage from '../components/login/LoginPage.vue'
import FindPasswordPage from '../components/account/FindPasswordPage.vue'
import FindIdPage from '../components/account/FindIdPage.vue'
import CaseSolvingPage from '../components/Medical/CaseSolvingPage.vue'
import CaseReviewPage from '../components/Medical/review/CaseReviewPage.vue'
import indexPage from '../components/main/indexPage.vue'
import LearningSetupPage from '../components/learning/LearningSetupPage.vue'
import ScreenAnalyzePage from '../components/analyze/ScreenAnalyzePage.vue'
import WrongNotePage from '../components/note/WrongNotePage.vue'
import LearningHistoryPage from '../components/history/LearningHistoryPage.vue'
import GlossaryPage from '../components/glossary/GlossaryPage.vue'
import IntroPage from '../components/intro/IntroPage.vue'
import MyPage from '../components/account/MyPage.vue'
import SettingsPage from '../components/account/SettingsPage.vue'
import {getUserSession} from '../components/login/authSession'
import {enforceAccountBinding} from '../components/login/accountSession'

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
            component: IntroPage,
            beforeEnter(to, from, next) {
                if (getUserSession()) {
                    next('/main')
                    return
                }
                next()
            }
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
            // 비밀번호 찾기(로그인 전 화면). 로그인 상태면 메인으로 보낸다(로그인 화면과 같은 규칙).
            path: '/find-password',
            component: FindPasswordPage,
            beforeEnter(to, from, next) {
                if (getUserSession()) {
                    next('/main')
                    return
                }
                next()
            }
        },
        {
            // 아이디 찾기(로그인 전 화면). 로그인 상태면 메인으로 보낸다.
            path: '/find-id',
            component: FindIdPage,
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
        },
        {
            path: '/mypage',
            component: MyPage,
            beforeEnter: requireSession
        },
        {
            path: '/settings',
            component: SettingsPage,
            beforeEnter: requireSession
        }
    ]
})

// 화면을 옮길 때마다 계정 서버 결속을 확인한다. 실행 설정이 바뀌었거나 두 서버 주소가 다르면 기존 세션을 지운다(그 뒤 각 경로의 세션 검사가 /login 으로 보낸다).
router.beforeEach(() => {
    enforceAccountBinding()
})

export default router
