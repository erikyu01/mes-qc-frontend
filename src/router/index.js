import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';
import VFormDesigner from '@/components/form-designer/index.vue';
import UserManagement from '@/views/UserManagement.vue';
import LoginPage from '@/views/LoginPage.vue';
import QualityFormManagement from '@/views/QualityFormManagement.vue';
import FormDisplay from '@/components/form-manager/FormDisplay.vue';
import TaskAssignment from '@/views/TaskAssignment.vue'

const routes = [
    {
        path: '/',
        // redirect: '/user-management', // Default route
    },
    {
        path: '/form-designer',
        name: 'FormDesigner',
        component: VFormDesigner,
    },
    {
        path: '/user-management',
        name: 'UserManagement',
        component: UserManagement,
    },
    {
        path: '/LoginPage',
        name: 'LoginPage',
        component: LoginPage,
    },
    {
        path: '/quality-form-management',
        name: 'QualityFormManagement',
        component: QualityFormManagement
    },
    {
        path: '/form-display',
        name: 'FormDisplay',
        component: FormDisplay
    },
    {
        path: '/task-assignment',
        name: 'TaskAssignment',
        component: TaskAssignment
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Global navigation guard to restrict routes based on user role
router.beforeEach((to, from, next) => {
    const userRole = store.state.user.role;

    // Allow access to the login page for everyone
    if (to.path === '/LoginPage') {
        next();
    } else if (userRole === 0) {
        // If role is 0, redirect to the login page
        next('/LoginPage');
    } else {
        // Allow access to other routes if the role is not 0
        next();
    }
});

export default router;
