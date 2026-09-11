import { createRouter, createWebHistory } from 'vue-router'
import SignUpPage from '../components/signup/SignUpPage.vue'
import LoginPage from '../components/login/LoginPage.vue'
import CaseSolvingPage from '../components/Medical/CaseSolvingPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/signup'
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
    }
  ]
})

export default router
