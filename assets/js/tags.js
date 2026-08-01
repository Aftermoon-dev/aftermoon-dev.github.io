(function () {
  var sections = document.querySelectorAll('.tag-section');

  function applyFilter() {
    var hash = decodeURIComponent(location.hash.replace('#', ''));

    if (!hash) {
      sections.forEach(function (section) {
        section.style.display = '';
      });
      return;
    }

    var matched = false;
    sections.forEach(function (section) {
      if (section.id === hash) {
        section.style.display = '';
        matched = true;
      } else {
        section.style.display = 'none';
      }
    });

    if (!matched) {
      sections.forEach(function (section) {
        section.style.display = '';
      });
    }
  }

  applyFilter();
  window.addEventListener('hashchange', applyFilter);
})();
