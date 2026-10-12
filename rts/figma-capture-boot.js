/* run-to-figma：?capture=<id> → 锁 390×844（hash 留给 #figmacapture） */
(function () {
  try {
    if (!new URLSearchParams(location.search).get('capture')) return;
  } catch (e) {
    return;
  }
  document.documentElement.classList.add('figma-capture');
})();
