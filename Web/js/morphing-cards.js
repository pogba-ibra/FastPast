// Magical Morphing Cards Animation
document.addEventListener('DOMContentLoaded', function () {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.morphing-card');
                cards.forEach((card, index) => {
                    const delay = card.dataset.delay || index * 200;
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, delay);
                });
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    });

    const magicalSection = document.querySelector('.standout-features.magical-reveal');
    if (magicalSection) {
        observer.observe(magicalSection);
    }
});
