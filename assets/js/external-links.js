document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.content a[href]').forEach(function (link) {
    if (link.hostname !== window.location.hostname) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
});
