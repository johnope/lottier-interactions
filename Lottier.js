document.addEventListener('DOMContentLoaded', () => {
    const lottieContainers = document.querySelectorAll('[data-lottie-url]');
    lottieContainers.forEach(container => {
      const url = container.getAttribute('data-lottie-url');
      const width = container.getAttribute('data-lottie-width') || '100%';
      const height = container.getAttribute('data-lottie-height') || '100%';
      const autoplay = container.getAttribute('data-lottie-autoplay') !== 'false';
      const loop = container.getAttribute('data-lottie-loop') !== 'false';
      const speed = parseFloat(container.getAttribute('data-lottie-speed')) || 1;
      const animation = lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: loop,
        autoplay: autoplay,
        path: url,
      });
      animation.setSpeed(speed);
      container.style.width = width;
      container.style.height = height;
      // Set up interactions
      setupInteractions(container, animation);
    });
  });
  
  function setupInteractions(container, animation) {
    const interactions = [
      { type: 'hover', attr: 'data-lottie-hover' },
      { type: 'click', attr: 'data-lottie-click' },
      { type: 'scroll', attr: 'data-lottie-scroll' },
      { type: 'mouseX', attr: 'data-lottie-mousex' },
      { type: 'mouseY', attr: 'data-lottie-mousey' },
      { type: 'drag', attr: 'data-lottie-drag' }
    ];
    interactions.forEach(interaction => {
      const config = container.getAttribute(interaction.attr);
      if (config) {
        setupInteraction(container, animation, interaction.type, config);
      }
    });
    // Set up external trigger
    const externalTrigger = container.getAttribute('data-lottie-external-trigger');
    if (externalTrigger) {
      const [selector, frames] = externalTrigger.split(':');
      const triggerElement = document.querySelector(selector);
      if (triggerElement) {
        setupInteraction(triggerElement, animation, 'click', frames);
      }
    }
  }
  
  function setupInteraction(element, animation, type, framesConfig) {
    const [startFrame, endFrame] = framesConfig.split(',').map(f => parseInt(f.trim()));
    const playFrames = (start, end) => {
      animation.playSegments([start, end], true);
    };
    switch (type) {
      case 'hover':
        element.addEventListener('mouseenter', () => playFrames(startFrame, endFrame));
        element.addEventListener('mouseleave', () => playFrames(endFrame, startFrame));
        break;
      case 'click':
        let isPlaying = false;
        element.addEventListener('click', () => {
          if (isPlaying) {
            animation.pause();
          } else {
            playFrames(startFrame, endFrame);
          }
          isPlaying = !isPlaying;
        });
        break;
      case 'scroll':
        window.addEventListener('scroll', () => {
          const rect = element.getBoundingClientRect();
          const visible = rect.top < window.innerHeight && rect.bottom >= 0;
          if (visible) {
            playFrames(startFrame, endFrame);
          } else {
            playFrames(endFrame, startFrame);
          }
        });
        break;
      case 'mouseX':
      case 'mouseY':
        document.addEventListener('mousemove', (e) => {
          const rect = element.getBoundingClientRect();
          const pos = type === 'mouseX' ? 
            (e.clientX - rect.left) / rect.width :
            (e.clientY - rect.top) / rect.height;
          const frame = Math.floor(startFrame + pos * (endFrame - startFrame));
          animation.goToAndStop(frame, true);
        });
        break;
      case 'drag':
        let isDragging = false;
        let startX, startY;
        let lastX, lastY;
        let originalSpeed = animation.playSpeed;
        let wasPlaying = animation.isPaused === false;
  
        element.style.position = 'absolute';
        element.style.cursor = 'move';
  
        element.addEventListener('mousedown', (e) => {
          isDragging = true;
          startX = e.clientX - element.offsetLeft;
          startY = e.clientY - element.offsetTop;
          lastX = e.clientX;
          lastY = e.clientY;
          wasPlaying = animation.isPaused === false;
          if (!wasPlaying) {
            animation.play();
          }
          e.preventDefault();
        });
  
        document.addEventListener('mousemove', (e) => {
          if (isDragging) {
            const newX = e.clientX - startX;
            const newY = e.clientY - startY;
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
  
            // Calculate drag speed and direction
            const dragSpeedX = e.clientX - lastX;
            const dragSpeedY = e.clientY - lastY;
            const dragSpeed = Math.sqrt(dragSpeedX * dragSpeedX + dragSpeedY * dragSpeedY);
            const dragDirection = dragSpeedX > 0 ? 1 : -1;
  
            // Adjust animation speed based on drag speed and direction
            const newSpeed = originalSpeed * (1 + dragSpeed * 0.1) * dragDirection;
            animation.setSpeed(newSpeed);
  
            // Ensure the animation keeps playing even if it reaches the end
            if (animation.currentFrame >= animation.totalFrames - 1) {
              animation.goToAndPlay(0);
            } else if (animation.currentFrame <= 0) {
              animation.goToAndPlay(animation.totalFrames - 1);
            }
  
            lastX = e.clientX;
            lastY = e.clientY;
          }
        });
  
        document.addEventListener('mouseup', () => {
          if (isDragging) {
            isDragging = false;
            // Reset animation speed to original
            animation.setSpeed(originalSpeed);
            if (!wasPlaying) {
              animation.pause();
            }
          }
        });
  
        break;
    }
  }