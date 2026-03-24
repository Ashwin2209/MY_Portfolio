import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [typewriterText, setTypewriterText] = useState("");
  const cursorDotRef = useRef(null);
  const cursorOutlineRef = useRef(null);
  const canvasRef = useRef(null);
  const typeIndexRef = useRef({ wordIndex: 0, charIndex: 0, isDeleting: false });
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2, radius: 150 });

  // Theme logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkTheme(false);
      document.body.classList.remove('dark-theme');
    } else {
      setIsDarkTheme(true);
      document.body.classList.add('dark-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(prev => {
      const newTheme = !prev;
      if (newTheme) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      }
      return newTheme;
    });
  };

  // Scroll Reveal Logic
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, { threshold: 0.1 });
    
    reveals.forEach(el => observer.observe(el));
    return () => reveals.forEach(el => observer.unobserve(el));
  }, []);

  // Custom Cursor Logic
  useEffect(() => {
    const cursorDot = cursorDotRef.current;
    const cursorOutline = cursorOutlineRef.current;
    let outlineX = mouseRef.current.x;
    let outlineY = mouseRef.current.y;
    let animationFrameId;

    const onMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      if (cursorDot) {
        cursorDot.style.left = `${e.clientX}px`;
        cursorDot.style.top = `${e.clientY}px`;
      }
    };

    const animateCursor = () => {
      const dx = mouseRef.current.x - outlineX;
      const dy = mouseRef.current.y - outlineY;
      outlineX += dx * 0.15;
      outlineY += dy * 0.15;
      if (cursorOutline) {
        cursorOutline.style.left = `${outlineX}px`;
        cursorOutline.style.top = `${outlineY}px`;
      }
      animationFrameId = requestAnimationFrame(animateCursor);
    };

    window.addEventListener('mousemove', onMouseMove);
    animateCursor();

    const interactiveElements = document.querySelectorAll('a, button, .card-custom, .about_me_card, .social-link');
    const addHover = () => document.body.classList.add('hovering');
    const removeHover = () => document.body.classList.remove('hovering');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', addHover);
      el.addEventListener('mouseleave', removeHover);
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
      });
    };
  }, []);

  // Typewriter Logic
  useEffect(() => {
    const words = ["Crafting experiences.", "> sudo make_it_happen", "import success", "404: Limits Not Found", "Building the future."];
    let timeoutId;
    
    const typeWriter = () => {
      const { wordIndex, charIndex, isDeleting } = typeIndexRef.current;
      const currentWord = words[wordIndex];
      let typeSpeed = 100;

      if (isDeleting) {
        setTypewriterText(currentWord.substring(0, charIndex - 1));
        typeIndexRef.current.charIndex--;
        typeSpeed = 40;
      } else {
        setTypewriterText(currentWord.substring(0, charIndex + 1));
        typeIndexRef.current.charIndex++;
        typeSpeed = 100;
      }

      if (!isDeleting && typeIndexRef.current.charIndex === currentWord.length) {
        typeIndexRef.current.isDeleting = true;
        typeSpeed = 2000;
      } else if (isDeleting && typeIndexRef.current.charIndex === 0) {
        typeIndexRef.current.isDeleting = false;
        typeIndexRef.current.wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500;
      }
      timeoutId = setTimeout(typeWriter, typeSpeed);
    };

    const startTimeout = setTimeout(typeWriter, 1200);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(startTimeout);
    };
  }, []);

  // Neon Network Canvas Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particlesArray = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      constructor(x, y, dx, dy, size, color) {
        this.x = x; this.y = y; this.dx = dx; this.dy = dy;
        this.size = size; this.color = color;
        this.baseX = x; this.baseY = y;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      update() {
        if (this.x > canvas.width || this.x < 0) this.dx = -this.dx;
        if (this.y > canvas.height || this.y < 0) this.dy = -this.dy;
        
        let dxMouse = mouseRef.current.x - this.x; 
        let dyMouse = mouseRef.current.y - this.y;
        let distance = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (distance < mouseRef.current.radius) {
          let forceDirectionX = dxMouse / distance;
          let forceDirectionY = dyMouse / distance;
          let force = (mouseRef.current.radius - distance) / mouseRef.current.radius;
          let directionX = forceDirectionX * force * 5;
          let directionY = forceDirectionY * force * 5;
          this.x -= directionX;
          this.y -= directionY;
        } else {
          if (this.x !== this.baseX) this.x -= (this.x - this.baseX) / 20;
          if (this.y !== this.baseY) this.y -= (this.y - this.baseY) / 20;
        }
        
        this.x += this.dx;
        this.y += this.dy;
        this.baseX += this.dx;
        this.baseY += this.dy;
        this.draw();
      }
    }

    const initParticles = () => {
      particlesArray = [];
      const numberOfParticles = (canvas.height * canvas.width) / 12000;
      const color = isDarkTheme ? '#00f0ff' : '#4f46e5';
      
      for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = Math.random() * innerWidth;
        let y = Math.random() * innerHeight;
        let dx = (Math.random() * 1) - 0.5;
        let dy = (Math.random() * 1) - 0.5;
        particlesArray.push(new Particle(x, y, dx, dy, size, color));
      }
    };

    const connectParticles = () => {
      let opacityValue = 1;
      let r = isDarkTheme ? 0 : 79;
      let g = isDarkTheme ? 240 : 70;
      let b_val = isDarkTheme ? 255 : 229;

      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) + 
                         ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
          
          if (distance < (canvas.width/10) * (canvas.height/10)) {
            opacityValue = 1 - (distance/15000);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b_val}, ${opacityValue * 0.4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animateCanvas = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      connectParticles();
      animationFrameId = requestAnimationFrame(animateCanvas);
    };

    resize();
    window.addEventListener('resize', resize);
    animateCanvas();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkTheme]);

  return (
    <>
      <div className="cursor-dot" ref={cursorDotRef} data-cursor-dot></div>
      <div className="cursor-outline" ref={cursorOutlineRef} data-cursor-outline></div>

      <canvas id="canvas-bg" ref={canvasRef}></canvas>

      <nav className="navbar navbar-expand-lg fixed-top navbar-animate">
        <div className="container">
          <a className="navbar-brand" href="#">Ashwinkumar.</a>
          <div className="d-flex align-items-center order-lg-3 ms-lg-3">
            <button className="theme-btn" id="themeToggle" onClick={toggleTheme}>
              <i className={`fas ${isDarkTheme ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button className="navbar-toggler ms-2 shadow-none border-0" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
              <i className="fas fa-bars" style={{ color: 'var(--text-main)' }}></i>
            </button>
          </div>
          <div className="collapse navbar-collapse" id="nav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item"><a className="nav-link mx-2" href="#about">About</a></li>
              <li className="nav-item"><a className="nav-link mx-2" href="#skills">Skills</a></li>
              <li className="nav-item"><a className="nav-link mx-2" href="#projects">Work</a></li>
              <li className="nav-item"><a className="nav-link mx-2" href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-3 mt-2 animate-hero delay-100">
                I'm Ashwinkumar <span className="wave-emoji">👋</span>
              </h1>
              <div className="typewriter-container animate-hero delay-250">
                <span className="typewriter-text" id="typewriter-text">{typewriterText}</span>
              </div>
              <p className="lead mb-4 text-muted animate-hero delay-300">
                I build responsive, human-centred web apps with clean, maintainable code. I love turning ideas into delightful digital experiences while continuously learning.
              </p>
              <div className="d-flex gap-3 justify-content-center justify-content-lg-start animate-hero delay-400">
                <a href="#projects" className="btn btn-primary-custom">View Projects</a>
                <a href="/resume.jpg" className="btn btn-outline-custom" download><i className="fas fa-download me-2"></i>CV</a>
              </div>
            </div>
            <div className="col-lg-6 text-center animate-hero delay-200">
              <img src="/image.jpg" alt="Profile" className="profile-img" />
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section-padding">
        <div className="container">
          <div className="mb-5 text-center reveal reveal-zoom">
            <h2>About Me</h2>
            <div className="divider mx-auto"></div>
          </div>
          <div className="row g-4">
            <div className="col-md-6 reveal reveal-left">
              <div className="about_me_card">
                <h1>Profession / Studies</h1>
                <p>I am currently pursuing a B.Tech in Information Technology, building a strong foundation in software development, data structures, algorithms, databases, networking, and modern web technologies.</p>
              </div>
            </div>
            <div className="col-md-6 reveal reveal-top">
              <div className="about_me_card">
                <h1>Skills / Strengths</h1>
                <p>I enjoy crafting responsive, user-friendly applications. My toolbox includes HTML5, CSS3, JavaScript, React.js, and modern frameworks. Continuous learning and best practices guide my workflow.</p>
              </div>
            </div>
            <div className="col-md-6 reveal reveal-bottom">
              <div className="about_me_card">
                <h1>Interests / Hobbies</h1>
                <p>Beyond tech, I explore UI/UX trends, listen to music, enjoy nature walks, and spend time with friends and family.</p>
              </div>
            </div>
            <div className="col-md-6 reveal reveal-right">
              <div className="about_me_card">
                <h1>Goals / Ambitions</h1>
                <p>I aim to become a versatile full-stack developer, delivering impactful digital products, solving real-world problems, and collaborating effectively.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="skills" className="section-padding">
        <div className="container">
          <div className="mb-5 text-center reveal reveal-zoom">
            <h2>Technical Expertise</h2>
            <div className="divider mx-auto"></div>
          </div>
          <div className="row g-4 justify-content-center">
            
            <div className="col-6 col-md-4 col-lg-3 reveal reveal-left">
              <div className="card-custom text-center py-4">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" className="skill-logo" />
                <h5 className="mt-2">React.js</h5>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3 reveal reveal-top">
              <div className="card-custom text-center py-4">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JavaScript" className="skill-logo" />
                <h5 className="mt-2">JavaScript</h5>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3 reveal reveal-bottom">
              <div className="card-custom text-center py-4">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" className="skill-logo" />
                <h5 className="mt-2">Python</h5>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3 reveal reveal-right">
              <div className="card-custom text-center py-4">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg" alt="Bootstrap" className="skill-logo" />
                <h5 className="mt-2">Bootstrap</h5>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3 reveal reveal-left">
              <div className="card-custom text-center py-4">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="GitHub" className="skill-logo" />
                <h5 className="mt-2">GitHub</h5>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3 reveal reveal-bottom">
              <div className="card-custom text-center py-4">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" alt="Figma" className="skill-logo" />
                <h5 className="mt-2">Figma</h5>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3 reveal reveal-top">
              <div className="card-custom text-center py-4">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg" alt="VS Code" className="skill-logo" />
                <h5 className="mt-2">VS Code</h5>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3 reveal reveal-right">
              <div className="card-custom text-center py-4">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" alt="MySQL" className="skill-logo" />
                <h5 className="mt-2">MySQL</h5>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section id="projects" className="section-padding">
        <div className="container">
          <div className="mb-5 text-center reveal reveal-zoom">
            <h2>Featured Projects</h2>
            <div className="divider mx-auto"></div>
          </div>
          <div className="row g-4">
            <div className="col-lg-4 col-md-6 reveal reveal-left">
              <div className="card-custom d-flex flex-column">
                <h4 className="mb-3">Foodie Menu</h4>
                <p className="text-muted flex-grow-1">A responsive digital menu application allowing users to browse and filter restaurant items by category.</p>
                <div className="mb-3">
                  <span className="tech-tag">JavaScript</span>
                  <span className="tech-tag">HTML/CSS</span>
                </div>
                <a href="https://github.com/Ashwin2209/Food-menu" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>View Code <i className="fas fa-arrow-right small ms-1"></i></a>
              </div>
            </div>
            
            <div className="col-lg-4 col-md-6 reveal reveal-zoom">
              <div className="card-custom d-flex flex-column">
                <h4 className="mb-3">FixMyCity</h4>
                <p className="text-muted flex-grow-1">Automated grievance system that generates formal letters from user input and handles email dispatching.</p>
                <div className="mb-3">
                  <span className="tech-tag">Python</span>
                  <span className="tech-tag">Automation</span>
                </div>
                <a href="https://github.com/Ashwin2209/SAmple" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>View Code <i className="fas fa-arrow-right small ms-1"></i></a>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 reveal reveal-right">
              <div className="card-custom d-flex flex-column">
                <h4 className="mb-3">Portfolio React</h4>
                <p className="text-muted flex-grow-1">This professional portfolio website featuring dark mode, interactive canvas background, and React UI.</p>
                <div className="mb-3">
                  <span className="tech-tag">React.js</span>
                  <span className="tech-tag">Vite</span>
                </div>
                <a href="https://github.com/Ashwin2209/MY_Portfolio" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>View Code <i className="fas fa-arrow-right small ms-1"></i></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="section-padding">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 reveal reveal-bottom">
              <div className="card-custom text-center p-5">
                <h2 className="mb-3">Let's Work Together</h2>
                <p className="text-muted mb-4">I am currently available for freelance projects and full-time opportunities.</p>
                <a href="mailto:aahwinramalakshmi@gmail.com" className="btn btn-primary-custom btn-lg mb-4">
                  <i className="fas fa-envelope me-2"></i> Get In Touch
                </a>
                
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <a href="https://github.com/" target="_blank" rel="noreferrer" className="social-link"><i className="fab fa-github"></i></a>
                  <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="social-link"><i className="fab fa-linkedin"></i></a>
                  <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="social-link"><i className="fab fa-instagram"></i></a>
                  <a href="https://x.com/home" target="_blank" rel="noreferrer" className="social-link"><i className="fab fa-twitter"></i></a>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <small>&copy; 2025 Ashwinkumar. Built with Professionalism & React.</small>
        </div>
      </footer>
    </>
  );
}

export default App;
