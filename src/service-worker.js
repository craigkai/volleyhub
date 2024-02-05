import { build, files, prerendered, version } from '$service-worker';
import { precacheAndRoute } from 'workbox-precaching';

const precache_list = [
    ...files, ...build, ...prerendered
].map(file => ({
    url: file, revision: version
}));


precacheAndRoute(precache_list);
