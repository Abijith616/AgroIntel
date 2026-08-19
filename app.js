document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.carousel-container');
  const screens = document.querySelectorAll('.carousel-container > .screen');
  const dots = document.querySelectorAll('.dot');
  
  if (!container) return;

  // Screen layout order: 
  // Index 0: Sleep (Clone)
  // Index 1: Home (Start for home.html)
  // Index 2: Diet (Start for diet.html & diet_custom.html)
  // Index 3: Workout (Start for workout.html)
  // Index 4: Sleep (Start for sleep.html)
  // Index 5: Home (Clone)
  
  const screenWidth = 375;
  let activeIndex = 1; // Default to Home
  
  // Set start screen based on current HTML file
  const pathname = window.location.pathname;
  if (pathname.includes('diet.html') || pathname.includes('diet_custom.html')) {
    activeIndex = 2;
  } else if (pathname.includes('workout.html')) {
    activeIndex = 3;
  } else if (pathname.includes('sleep.html')) {
    activeIndex = 4;
  } else {
    activeIndex = 1; // home
  }

  // Position initial scroll
  container.scrollLeft = activeIndex * screenWidth;
  updateIndicators(activeIndex);

  // Scroll event listener to handle infinite looping and indicator updates
  let isScrollJumping = false;
  
  container.addEventListener('scroll', () => {
    if (isScrollJumping) return;
    
    const scrollLeft = container.scrollLeft;
    const exactIndex = scrollLeft / screenWidth;
    const roundedIndex = Math.round(exactIndex);

    // Dynamic Dot Updates during scroll
    let displayIndex = roundedIndex;
    if (roundedIndex === 0) displayIndex = 4; // Sleep clone maps to Sleep dot
    if (roundedIndex === 5) displayIndex = 1; // Home clone maps to Home dot
    updateIndicators(displayIndex);

    // Infinite Loop Jump Boundaries
    if (scrollLeft <= 10) { // Near left edge (Sleep clone)
      isScrollJumping = true;
      // Instantly jump to actual Sleep screen (Index 4)
      container.scrollTo({ left: 4 * screenWidth, behavior: 'auto' });
      setTimeout(() => { isScrollJumping = false; }, 50);
    } else if (scrollLeft >= 5 * screenWidth - 10) { // Near right edge (Home clone)
      isScrollJumping = true;
      // Instantly jump to actual Home screen (Index 1)
      container.scrollTo({ left: 1 * screenWidth, behavior: 'auto' });
      setTimeout(() => { isScrollJumping = false; }, 50);
    }
  });

  // Handle slide snap end to update browser URL smoothly
  let scrollTimeout;
  container.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (isScrollJumping) return;
      const finalIndex = Math.round(container.scrollLeft / screenWidth);
      let pageName = 'home.html';
      
      if (finalIndex === 1 || finalIndex === 5) pageName = 'home.html';
      else if (finalIndex === 2) {
        // Check if custom is on
        pageName = pathname.includes('diet_custom.html') ? 'diet_custom.html' : 'diet.html';
      }
      else if (finalIndex === 3) pageName = 'workout.html';
      else if (finalIndex === 4 || finalIndex === 0) pageName = 'sleep.html';
      
      // Update history if screen changed and pushState is supported
      const currentPageName = pathname.split('/').pop() || 'home.html';
      if (pageName !== currentPageName && pageName !== 'diet_custom.html') {
        try {
          // If on a web server, update URL bar
          if (window.location.protocol !== 'file:') {
            history.pushState(null, '', pageName);
          }
        } catch (e) {
          console.warn('URL state update blocked by browser policy:', e);
        }
      }
    }, 150);
  });

  // Dot Click Navigation
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetScreen = dot.getAttribute('data-screen');
      let targetIndex = 1;
      let targetFile = 'home.html';

      if (targetScreen === 'home') { targetIndex = 1; targetFile = 'home.html'; }
      else if (targetScreen === 'diet') { 
        targetIndex = 2; 
        targetFile = pathname.includes('diet_custom.html') ? 'diet_custom.html' : 'diet.html'; 
      }
      else if (targetScreen === 'workout') { targetIndex = 3; targetFile = 'workout.html'; }
      else if (targetScreen === 'sleep') { targetIndex = 4; targetFile = 'sleep.html'; }

      // Smooth scroll to target
      container.scrollTo({ left: targetIndex * screenWidth, behavior: 'smooth' });

      // Navigate after transition if file protocol (ensuring separate files actually open)
      if (window.location.protocol === 'file:') {
        const currentFile = pathname.split('/').pop() || 'home.html';
        if (currentFile !== targetFile) {
          setTimeout(() => {
            window.location.href = targetFile;
          }, 300);
        }
      }
    });
  });

  function updateIndicators(index) {
    dots.forEach(dot => {
      dot.classList.remove('active', 'home', 'diet', 'workout', 'sleep');
      const dotScreen = dot.getAttribute('data-screen');
      
      if (
        (index === 1 && dotScreen === 'home') ||
        (index === 2 && dotScreen === 'diet') ||
        (index === 3 && dotScreen === 'workout') ||
        (index === 4 && dotScreen === 'sleep')
      ) {
        dot.classList.add('active', dotScreen);
      }
    });
  }

  // Desktop Mouse Drag to Scroll interaction
  let isDown = false;
  let startX;
  let scrollLeftState;

  container.addEventListener('mousedown', (e) => {
    isDown = true;
    container.style.scrollSnapType = 'none'; // Temporarily disable snap during drag
    startX = e.pageX - container.offsetLeft;
    scrollLeftState = container.scrollLeft;
  });

  container.addEventListener('mouseleave', () => {
    if (!isDown) return;
    isDown = false;
    snapToNearestScreen();
  });

  container.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    snapToNearestScreen();
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll multiplier
    container.scrollLeft = scrollLeftState - walk;
  });

  function snapToNearestScreen() {
    container.style.scrollSnapType = 'x mandatory'; // Re-enable snap
    const finalIndex = Math.round(container.scrollLeft / screenWidth);
    container.scrollTo({ left: finalIndex * screenWidth, behavior: 'smooth' });
  }

  /* --- App Interaction Logic --- */

  // 1. Water Tracker Logging (Home Page)
  const logWaterBtn = document.getElementById('log-water-btn');
  const waterQtyText = document.getElementById('water-qty-text');
  if (logWaterBtn && waterQtyText) {
    logWaterBtn.addEventListener('click', () => {
      let currentVal = parseInt(waterQtyText.textContent.split('/')[0].replace(/,/g, '').trim());
      let targetVal = 2500;
      let newVal = Math.min(currentVal + 250, targetVal);
      waterQtyText.innerHTML = `<strong>${newVal.toLocaleString()}</strong> / ${targetVal} ml`;
      
      // Mini animation
      logWaterBtn.style.transform = 'scale(0.85)';
      setTimeout(() => logWaterBtn.style.transform = 'scale(1)', 150);
      
      showToast(`Logged 250ml water! (${newVal}/${targetVal} ml)`);
    });
  }

  // 2. Custom Diet Toggle (Diet Pages)
  const customToggle = document.getElementById('diet-custom-toggle');
  if (customToggle) {
    customToggle.addEventListener('click', () => {
      const isCustomPage = pathname.includes('diet_custom.html');
      const targetPage = isCustomPage ? 'diet.html' : 'diet_custom.html';
      
      // Visual switch trigger
      customToggle.classList.toggle('active');
      
      // Redirect
      setTimeout(() => {
        window.location.href = targetPage;
      }, 150);
    });
  }

  // 3. Avatar Click & Account Menu Popover
  const avatarBtn = document.getElementById('avatar-btn');
  const popoverMenu = document.getElementById('popover-menu');
  const backdrop = document.getElementById('page-backdrop');

  if (avatarBtn && popoverMenu) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      avatarBtn.classList.toggle('active');
      popoverMenu.classList.toggle('open');
      if (backdrop) backdrop.classList.toggle('active');
    });

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        avatarBtn.classList.remove('active');
        popoverMenu.classList.remove('open');
        backdrop.classList.remove('active');
      });
    }

    // Close menu when clicking anywhere else
    document.addEventListener('click', (e) => {
      if (!popoverMenu.contains(e.target) && e.target !== avatarBtn) {
        avatarBtn.classList.remove('active');
        popoverMenu.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
      }
    });
  }

  // 4. Workout checklist toggles (Workout Page)
  const exerciseCards = document.querySelectorAll('.exercise-card');
  const recoveryCircleBar = document.querySelector('#recovery-circle-bar');
  const recoveryNumber = document.querySelector('#recovery-number');
  
  if (exerciseCards.length > 0) {
    exerciseCards.forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('checked');
        
        // Calculate recovery score based on checks
        const checkedCount = document.querySelectorAll('.exercise-card.checked').length;
        const baseScore = 86;
        const newScore = Math.max(baseScore - (checkedCount * 5), 60);
        
        if (recoveryNumber) recoveryNumber.textContent = newScore;
        if (recoveryCircleBar) {
          const radius = 20;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (newScore / 100) * circumference;
          recoveryCircleBar.style.strokeDashoffset = strokeDashoffset;
        }

        // Show Toast
        const exName = card.querySelector('.exercise-name').textContent;
        const isChecked = card.classList.contains('checked');
        showToast(isChecked ? `Completed: ${exName}` : `Unchecked: ${exName}`);
      });
    });
  }

  // 5. Start Workout Button
  const startWorkoutBtn = document.getElementById('start-workout-btn');
  if (startWorkoutBtn) {
    let workoutTimerInterval;
    let seconds = 0;
    
    startWorkoutBtn.addEventListener('click', () => {
      if (startWorkoutBtn.classList.contains('active')) {
        // Stop workout
        clearInterval(workoutTimerInterval);
        startWorkoutBtn.classList.remove('active');
        startWorkoutBtn.style.backgroundColor = 'var(--color-mint)';
        startWorkoutBtn.style.color = '#000';
        startWorkoutBtn.textContent = 'Start Workout';
        showToast('Workout finished! Great job!', 'success');
      } else {
        // Start workout
        startWorkoutBtn.classList.add('active');
        startWorkoutBtn.style.backgroundColor = 'var(--color-coral)';
        startWorkoutBtn.style.color = '#fff';
        seconds = 0;
        startWorkoutBtn.textContent = 'Stop (00:00)';
        
        workoutTimerInterval = setInterval(() => {
          seconds++;
          const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
          const secs = (seconds % 60).toString().padStart(2, '0');
          startWorkoutBtn.textContent = `Stop (${mins}:${secs})`;
        }, 1000);
        
        showToast('Leg Day workout started!', 'success');
      }
    });
  }

  // Helper Toast Alert function (Premium UI micro-animation)
  function showToast(message, type = 'info') {
    // Check if toast container exists
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.style.cssText = `
        position: absolute;
        bottom: 70px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        width: 300px;
      `;
      // Find parent of container (which is phone-viewport)
      const viewport = document.querySelector('.phone-viewport');
      if (viewport) viewport.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `
      background-color: rgba(21, 24, 31, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-left: 3px solid ${type === 'success' ? 'var(--color-mint)' : 'var(--color-blue)'};
      padding: 10px 16px;
      border-radius: 12px;
      color: white;
      font-size: 11px;
      font-weight: 600;
      box-shadow: 0 10px 20px rgba(0,0,0,0.3);
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      text-align: center;
      backdrop-filter: blur(10px);
    `;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Animate In
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    // Animate Out
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2500);
  }
});
