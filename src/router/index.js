import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';
import VFormDesigner from '@/components/form-designer/index.vue';
import UserManagement from '@/views/UserManagement.vue';
import LoginPage from '@/views/LoginPage.vue';
import QualityFormManagement from '@/views/QualityFormManagement.vue';
import FormDisplay from '@/components/form-manager/FormDisplay.vue';
import MyFutureTask from "@/views/TaskCenter/MyFutureTask.vue";
import MyTodayTask from "@/views/TaskCenter/MyTodayTask.vue";
import MyHistoryTask from "@/views/TaskCenter/MyHistoryTask.vue";
import MyOverdueTask from "@/views/TaskCenter/MyOverdueTask.vue";
import TaskCenterDashboard from "@/views/TaskCenter/TaskCenterDashboard.vue";
import ErikTestView from "@/views/ErikTestView.vue";
import QcTaskSubmissionLogs from "@/components/task-center/QcTaskSubmissionLogs.vue";
import OrderManagement from "@/views/OrderManagement.vue";
import ReportManagement from "@/views/ReportManagement.vue";
import FormDataSummary from "@/views/FormDataSummary.vue";
import InstrumentManagement from "@/views/InstrumentManagement.vue";
import SamplingLocationManagement from "@/views/SamplingLocationManagement.vue";
import TestSubjectManagement from "@/views/TestSubjectManagement.vue";
import TeamManagement from "@/views/TeamManagement.vue";
import PendingTasks from "@/views/TaskCenter/PendingTasks.vue";
import ShiftManagement from "@/views/shiftManagement.vue";
import FormAccessCalendarV2 from "@/components/team-form-calendar/formAccessCalendarV2.vue";

const routes = [
    {
        path: '/',
        redirect: '/task-center-dashboard', // Default route
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
        path: '/team-management',
        name: 'TeamManagement',
        component: TeamManagement,
    },
    {
        path: '/shift-management',
        name: 'ShiftManagement',
        component: ShiftManagement,
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
        path: '/form-data-summary',
        name: 'FormDataSummary',
        component: FormDataSummary
    },
    {
        path: '/form-access-calendar',
        name: 'FormAccessCalendar',
        component: FormAccessCalendarV2,
    },
    {
        path: '/task-assignment',
        name: 'TaskAssignment',
        component: OrderManagement,
    },
    {
        path: '/pending-tasks',
        name: 'PendingTasks',
        component: PendingTasks
    },
    {
        path: '/current-tasks',
        name: 'MyCurrentTask',
        component: MyTodayTask
    },
    {
        path: '/future-tasks',
        name: 'MyFutureTask',
        component: MyFutureTask
    },
    {
        path: '/history-tasks',
        name: 'MyHistoryTask',
        component: MyHistoryTask
    },
    {
        path: '/overdue-tasks',
        name: 'MyOverdueTask',
        component: MyOverdueTask
    },
    {
        path: '/form-display/:qcFormTemplateId',
        name: 'FormDisplay',
        component: FormDisplay,
        props: route => ({
            qcFormTemplateId: route.params.qcFormTemplateId, // Path parameter
            usable: route.query.usable === 'true', // Query parameter, parse to boolean
            dispatchedTaskId: route.query.dispatchedTaskId, // Query parameter, parse to number
            switchDisplayed: route.query.switchDisplayed === 'true', // Query parameter, parse to boolean
            rt: route.query.rt // Query parameter, parse to number
        }),
    },
    {
        path: '/task-center-dashboard',
        name: 'TaskCenterDashboard',
        component: TaskCenterDashboard
    },
    {
        path: '/erik-test',
        name: 'ErikTest',
        component: ErikTestView
    },
    {
        path: '/report',
        name: 'Report',
        component: ReportManagement
    },
    {
        path: '/task-log/:createdBy/:dispatchedTaskId/:taskName',
        name: 'TaskLog',
        component: QcTaskSubmissionLogs,
        props: true, // Pass route params as props to the component
    },
    {
        path: '/instrument-management',
        name: 'InstrumentManagement',
        component: InstrumentManagement,
    },
    {
        path: '/sampling-location-management',
        name: 'SamplingLocationManagement',
        component: SamplingLocationManagement,
    },
    {
        path: '/test-subject-management',
        name: 'TestSubjectManagement',
        component: TestSubjectManagement,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Global navigation guard to restrict routes based on user role
router.beforeEach((to, from, next) => {
    const userRole = store.state.user.role.id;
    console.log('[Router] userRole:', userRole);

    if (to.path === '/LoginPage') {
        next();
    } else if (userRole === 0) {
        next('/LoginPage');
    } else if (userRole === 3 && [
        '/form-designer',
        '/user-management',
        '/team-management',
        '/quality-form-management',
        '/form-data-summary',
        '/task-assignment',
        '/instrument-management',
        '/sampling-location-management',
        '/test-subject-management'
    ].includes(to.path)) {
        next('/task-center-dashboard');
    } else {
        next();
    }
});


export default router;
