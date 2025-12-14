// Parallax scrolling effect for features page
document.addEventListener('DOMContentLoaded', () => {
    const parallaxElements = document.querySelectorAll('.parallax-element');

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1); // Different speed for each element
            const yPos = -(scrollY * speed);

            element.style.transform = `translateY(${yPos}px)`;
        });

        // Subtle parallax for hero content
        const heroContent = document.querySelector('.features-hero .container');
        if (heroContent) {
            const speed = 0.2;
            const yPos = -(scrollY * speed);
            heroContent.style.transform = `translateY(${yPos}px)`;
        }
    });

    // Floating icons parallax
    const floatingIcons = document.querySelectorAll('.floating-icon');
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        floatingIcons.forEach((icon, index) => {
            const speed = 0.3 + (index * 0.05);
            const yPos = -(scrollY * speed);
            const rotation = scrollY * 0.1 * (index % 2 === 0 ? 1 : -1);

            icon.style.transform = `translateY(${yPos}px) rotate(${rotation}deg)`;
        });
    });
});
