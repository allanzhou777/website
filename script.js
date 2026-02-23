// Set copyright year
document.getElementById("copyright").textContent = `COPYRIGHT ${new Date().getFullYear()} ALLAN ZHOU`

// Highlight active page in navigation
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const pageLinks = document.querySelectorAll('.page-link');
  
  pageLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});
