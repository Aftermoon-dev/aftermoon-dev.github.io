function updateGiscusTheme(isDark) {
    var iframe = document.querySelector('iframe.giscus-frame');
    if (!iframe) return;
    iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: isDark ? 'dark' : 'light' } } },
        'https://giscus.app'
    );
}

window.addEventListener('message', function (event) {
    if (event.origin !== 'https://giscus.app') return;
    if (event.data && event.data.giscus && 'discussion' in event.data.giscus) {
        updateGiscusTheme(true);
    }
});
