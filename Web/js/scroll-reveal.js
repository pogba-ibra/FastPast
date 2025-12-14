// Scroll Reveal Animations
document.addEventListener('DOMContentLoaded', () => {
  // Elements to reveal on scroll
  const reveals = document.querySelectorAll('.reveal');

  // Function to check if an element is in viewport
  const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 &&
      rect.bottom >= 0
    );
  };

  // Function to add the 'active' class to elements in viewport
  const revealElements = () => {
    reveals.forEach(element => {
      if (isInViewport(element)) {
        element.classList.add('active');
      }
    });
  };

  // Initial check on page load
  revealElements();

  // Check on scroll
  window.addEventListener('scroll', revealElements);

  // Check on resize
  window.addEventListener('resize', revealElements);
});
