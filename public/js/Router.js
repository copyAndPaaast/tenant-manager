export default class Router {
    constructor(routes = {}, rootElement) {
        this.routes = routes;
        this.rootElement = rootElement;

        // Listen to history changes
        window.addEventListener('popstate', this.handleRoute.bind(this));

        // Listen to custom navigation events
        document.body.addEventListener('click', e => {
            if (e.target.matches('[data-link]')) {
                e.preventDefault();
                this.navigate(e.target.href);
            }
        });
    }

    navigate(url) {
        window.history.pushState(null, null, url);
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        let matchedRoute = null;

        // Update active class on nav links
        document.querySelectorAll('nav a[data-link]').forEach(link => {
            const href = link.getAttribute('href');
            if (href === path) {
                link.classList.add('active');
            } else if (path.startsWith(href) && href !== '/') {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Simple routing matching
        for (const [routePath, componentClass] of Object.entries(this.routes)) {
            // Convert /buildings/:id to regex
            const regexPath = routePath.replace(/:[^\s/]+/g, '([\\w-]+)');
            const regex = new RegExp(`^${regexPath}$`);
            const match = path.match(regex);

            if (match) {
                matchedRoute = {
                    component: componentClass,
                    params: match.slice(1) // Capture groups
                };
                break;
            }
        }

        if (matchedRoute) {
            const ComponentClass = matchedRoute.component;
            const instance = new ComponentClass({ params: matchedRoute.params });
            instance.mount(this.rootElement);
        } else {
            // Generic 404
            this.rootElement.innerHTML = `<h1>404 - Not Found</h1>`;
        }
    }

    init() {
        this.handleRoute();
    }
}
