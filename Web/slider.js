// Touch slider for mobile feature items

document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".feature-slider");
  const container = document.querySelector(".feature-slider-container");
  const dots = document.querySelectorAll(".dot");
  const slides = slider ? slider.querySelectorAll(".feature-item-standout") : [];
  const slideCount = slides.length || 1;
  const prevArrow = document.querySelector(".slider-arrow.prev");
  const nextArrow = document.querySelector(".slider-arrow.next");
  const progressThumb = document.querySelector(".slider-progress-thumb");
  const sliderTip = document.querySelector(".slider-tip");
  
  let currentIndex = 0;
  let startX = 0;
  let isDragging = false;
  let hasSwiped = false;

  if (!slider || !container) return; // Exit if slider doesn't exist

  const hideTip = () => {
    if (sliderTip && !sliderTip.classList.contains("hidden")) {
      sliderTip.classList.add("hidden");
    }
  };

  // Touch event listeners
  slider.addEventListener('touchstart', touchStart);
  slider.addEventListener('touchmove', touchMove);
  slider.addEventListener('touchend', touchEnd);

  // Mouse event listeners for desktop testing
  slider.addEventListener('mousedown', touchStart);
  slider.addEventListener('mousemove', touchMove);
  slider.addEventListener('mouseup', touchEnd);
  slider.addEventListener('mouseleave', touchEnd);

  // Cache layout metrics to prevent forced reflows
  let cachedStride = 0;
  let cachedThreshold = 0;

  function updateLayoutMetrics() {
    if (!slider || !container) return;
    
    // Calculate stride dynamically
    if (slides.length > 1) {
      cachedStride = slides[1].offsetLeft - slides[0].offsetLeft;
    } else if (slides.length === 1) {
      cachedStride = slides[0].offsetWidth;
    } else {
      cachedStride = container.clientWidth;
    }

    // Fallback if stride is 0
    if (cachedStride === 0) cachedStride = container.clientWidth;

    // Cache threshold for swipe detection
    cachedThreshold = container.clientWidth * 0.2;
  }

  // Initial calculation
  updateLayoutMetrics();

  window.addEventListener('resize', () => {
    updateLayoutMetrics();
    setPositionByIndex();
  });

  // Click on dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      hideTip();
      goToSlide(index);
    });
  });

  // Arrow controls
  if (prevArrow) {
    prevArrow.addEventListener('click', () => {
      hideTip();
      goToSlide(currentIndex - 1);
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener('click', () => {
      hideTip();
      goToSlide(currentIndex + 1);
    });
  }

  function touchStart(event) {
    isDragging = true;
    hasSwiped = false;
    startX = getPositionX(event);
    slider.style.transition = 'none';
    hideTip();
  }

  function touchMove(event) {
    if (!isDragging || hasSwiped) return;
    
    const currentX = getPositionX(event);
    const deltaX = currentX - startX;
    
    // Use cached threshold instead of reading clientWidth
    if (Math.abs(deltaX) > cachedThreshold) {
      hasSwiped = true;
      
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous slide
        currentIndex--;
      } else if (deltaX < 0 && currentIndex < slideCount - 1) {
        // Swipe left - go to next slide
        currentIndex++;
      }
      
      goToSlide(currentIndex);
    }
  }

  function touchEnd() {
    if (isDragging) {
      isDragging = false;
      hasSwiped = false;
      goToSlide(currentIndex);
    }
  }

  function goToSlide(index) {
    currentIndex = Math.max(0, Math.min(index, slideCount - 1));
    
    // Use cached stride instead of calculating offsetLeft/width
    const offset = -currentIndex * cachedStride;
    
    slider.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
    slider.style.transform = `translateX(${offset}px)`;
    
    updateUI();
    
    setTimeout(() => {
      slider.style.transition = 'none';
    }, 400);
  }

  function getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
  }

  function setPositionByIndex() {
    goToSlide(currentIndex);
  }

  // Removed unused getSlideWidth to prevent dead code reflows

  function updateUI() {
    dots.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
    
    // Update debug indicator if it exists
    const indicator = document.querySelector('.current-slide-indicator');
    if (indicator) {
      indicator.textContent = `Current: Slide ${currentIndex + 1}`;
    }
    
    updateProgress();
    updateArrows();
  }

  function updateProgress() {
    if (!progressThumb) return;
    const width = ((currentIndex + 1) / slideCount) * 100;
    progressThumb.style.width = `${width}%`;
  }

  function updateArrows() {
    if (!prevArrow || !nextArrow) return;
    prevArrow.classList.toggle('disabled', currentIndex === 0);
    nextArrow.classList.toggle('disabled', currentIndex === slideCount - 1);
  }

  // Initialize slider position
  goToSlide(0);
});
