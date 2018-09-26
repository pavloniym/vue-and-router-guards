import get from 'lodash/get';
import merge from 'lodash/merge'


/**
 * Check auth status
 *
 * @param to
 * @param from
 * @param next
 * @param store
 * @param redirect
 *
 */
const authCheckGuard = (to, from, next, {hasSession = false, isAuthorized = null, getUser, redirect = null}) => {


    const route = to.matched[to.matched.length - 1];
    const guest = getParentRouteMeta(route, 'public', false);


    /*
     * If the user is not authenticated and visits
     * a page that requires authentication, redirect to the login page
     */
    if (guest === false) {


        /*
         * If there is no session in browser cookie — move to auth page
         */
        if (hasSession === false) return next(redirect);
        if (hasSession === true) {

            /*
             * If there is session — should be checked
             * If it wasn't already checked — make request: on 200 — next, 401 — on auth page
             * If it was checked — move next
             */

            if (isAuthorized === true) return next();
            if (!isAuthorized) return getUser(next, redirect).then(_ => next()).catch(_ => next(redirect))
        }

    } else return next();

};


/**
 * Check access rights to enter route
 *
 * @param to
 * @param from
 * @param next
 * @param store
 * @param redirect
 */
const rightsCheckGuard = (to, from, next, {redirect = null, rights = [], isAuthorized = null}) => {


    const route = to.matched[to.matched.length - 1];


    /*
     * Try to get some meta data using deep search -> search through parent components
     * Get access object with necessary rights to access route
     * Get authorized status of route -> user can enter without special rights
     *
     */
    const guest = getParentRouteMeta(route, 'public', false);
    const authorized = getParentRouteMeta(route, 'authorized', false) && isAuthorized;
    const access = getParentRouteMeta(route, 'access', null);


    /*
     * If route has guest = true -> public route
     * If guest is false -> check rights
     */
    if (guest === true || authorized === true) return next();
    if (guest === false) {


        /*
         * If found access from all paths tree -> check user's rights
         * If not found -> redirect to 404 page
         */
        if (access) {
            if (!!get(rights, [access.component || null, access.module || null, access.action || null], false) === true) {


                /*
                 * Merge meta from all parent routes
                 */
                merge(to.meta, mergeParentRouteMeta(to.matched || []));
                return next();

            } else return next(redirect);
        } else return next(redirect);
    }

};


/**
 * Get nested object searching through all parent tree
 *
 * @param object
 * @param property
 * @param fallback
 * @param root
 * @returns {*}
 */
const getParentRouteMeta = (object, property, fallback = null, root = 'meta') => {

    const prop = get(object, [root, property], fallback);
    return prop ? prop : (get(object, 'parent', null) !== null ? getParentRouteMeta(object.parent, property, fallback) : fallback);

};


/**
 * Merge all meta objects into one through all matched routes
 *
 * @param matched
 * @returns {*}
 */
const mergeParentRouteMeta = (matched) => {
    return matched.reduce((meta, route) => {
        const m = get(route, 'meta', {});
        return merge(meta, m);
    }, {});
};


export {
    authCheckGuard,
    rightsCheckGuard
}
