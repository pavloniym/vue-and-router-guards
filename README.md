# Vue Router Guards

This is a package with 2 vue-router guards:
* Authorization Guard
* Access Guard

## Authorization Guard
This guard is used to check user's authorization status before resolving any route

### Example

```js

// vue-router.js

import Vue from 'vue';
import VueRouter from 'vue-router';

import cookies from 'js-cookie';
import configs from "@configs";
import store from '@store';

import {authCheckGuard} from 'vue-router-guards'
import routes from './routes';

Vue.use(VueRouter);

export const router = new VueRouter({routes});


/**
 * =============
 * Global hooks
 * =============
 *
 * Set global hooks for vue-router
 */

/*
 * Set guard to check authorized status
 */
router.beforeEach((to, from, next) => authCheckGuard(to, from, next, {

    // Set redirect to auth
    redirect: {name: 'system.auth', replace: true},

    // Has client session or not
    hasSession: !!cookies.get(configs.cookieSession),

    // Check if authorized or not
    isAuthorized: store.getters['account/authorized'],

    // Send action to get user data
    // Return promise
    getUser: (next, redirect) => {
        return new Promise((resolve, reject) => {
                store
                    .dispatch('account/user')
                    .then(_ => store.getters['account/authorized'] === true ? resolve() : reject())
            }
        )
    }
}));


```

### Arguments
* `to` — the target Route Object being navigated to (standard vue-router argument)
* `from` — the current route being navigated away from (standard vue-router argument)
* `next` — this function must be called to resolve the hook (standard vue-router argument)
* `options` — object with authorization guard configuration
    * `redirect` - redirect to auth page for authorization check's fail (you can pass any valid location object)
    * `hasSession` — boolean, check if user has session (in cookies for example). If it is false — redirect to auth page
    * `isAuthorized` — boolean, check if user is already authorized in application (take from store or cookies for example ). If it is false — try to get user data,
    * `getUser` — function-Promise with resolve/reject status for fetching user data (get from API and save it in store  for example). Resolve — go next(), reject — redirect to auth page 
    


## Access Guard
This guard is used to check access to route  
* You should pass user's rights
* You should set additional `meta` data in your routes

> It is not necessary to set `access` data on all your nested routes - guard will try to find missing data from parent routes and use them 

### Example
```js

// vue-router.js

import Vue from 'vue';
import VueRouter from 'vue-router';

import store from '@store';

import {authCheckGuard} from 'vue-router-guards'
import routes from './routes';

Vue.use(VueRouter);

export const router = new VueRouter({routes});

/**
 * =============
 * Global hooks
 * =============
 *
 * Set global hooks for vue-router
 */

/*
 * Set guard to check rights access
 */
router.beforeEach((to, from, next) => rightsCheckGuard(to, from, next, {

    // Set redirect to 404 page
    redirect: {name: 'system.404', replace: true},

    // Check if authorized or not
    isAuthorized: store.getters['account/authorized'],
    
    // Get user's rights
    rights: store.getters['account/rights'],
}));

```

### Arguments
* `to` — the target Route Object being navigated to (standard vue-router argument)
* `from` — the current route being navigated away from (standard vue-router argument)
* `next` — this function must be called to resolve the hook (standard vue-router argument)
* `options` — object with authorization guard configuration
    * `redirect` - redirect to 404 page in case of access check's fail (you can pass any valid location object)
    * `isAuthorized` — boolean, check if user is already authorized in application (take from store or cookies for example )
    * `rights` — object with user's rights 
    

### User's rights

You need to provide an object with user's rights

```js
const rights = {
    'scheduler': { // is component key in meta.access
        'main': { // is module key in meta.access
            'show': true, // is action key in meta.access (true — access, false (or not exists) — restricted)
        },
        'tasks': {
            'results': false // (or not exists)
        }
    }
}
```

### Route's meta
```js

export default  [
    {
        path: '/auth',
        name: 'system.auth',
        meta: {
            public: true // public route -> access without authorization or special rights
        }, 
    },
    {
        path: '/',
        name: 'dashboard',
        meta: {
            authorized: true, // access only for authorized users but without special rights
        }
    },
    {
        path: '/scheduler',
        name: 'scheduler',
        meta: {
            access: { // special rights for this route will be used
                component: 'scheduler', 
                module: 'main', 
                action: 'show'
            },
        },
        children: [
            {
                path: 'tasks/:id(\\d+)?',
                name: 'scheduler.tasks',
                meta: {
                    // no need to set access object -> guard will use data from parent (`scheduler` route)
                },
                children: [
                    {
                        path: 'add',
                        name: 'scheduler.tasks.add',
                        meta: {
                            access: { // special rights for this route will be used
                                component: 'scheduler', 
                                module: 'tasks', 
                                action: 'add'
                            },
                        },              
                    },
                    {
                        path: 'result',
                        name: 'scheduler.tasks.result',
                        meta: {
                            // no need to set access object -> guard will use data from parent (`scheduler` route)
                        }
                    },
                ]
            }
        ]
    },    
]

    
```
