export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.7427d33d.js","app":"_app/immutable/entry/app.f14ac7a5.js","imports":["_app/immutable/entry/start.7427d33d.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/singletons.43e61cfd.js","_app/immutable/entry/app.f14ac7a5.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/index.0719bd3d.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();
