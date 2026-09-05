function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Next.js `output: "export"` with the default trailingSlash:false emits
    // <route>.html, never <route>/index.html. Only the site root is
    // index.html.
    if (uri === '/') {
        request.uri = '/index.html';
        return request;
    }
    if (uri.endsWith('/')) {
        request.uri = uri.slice(0, -1) + '.html';
        return request;
    }

    // Match a KNOWN static extension rather than "the last segment
    // contains a dot".
    //
    // This site has no dotted route segments today, so the dot heuristic
    // would happen to work here. It is still wrong, and it is not used,
    // because it shipped broken on the provider site: every version
    // landing page there (/github/1.2.3) has a dot in its last segment,
    // so all of them 404'd in production while their child pages served
    // fine. One page slug containing a version, a filename or a decimal
    // would reproduce it here. Extension list derived from what this
    // site's real export contains (.txt .html .json .js .css .svg .png),
    // plus the font and image types a future asset could reasonably add.
    var STATIC_EXT = /\.(html|txt|json|js|mjs|css|map|svg|png|jpe?g|gif|ico|webp|avif|woff2?|ttf|eot|xml|webmanifest)$/i;
    if (!STATIC_EXT.test(uri)) {
        request.uri = uri + '.html';
    }
    return request;
}
