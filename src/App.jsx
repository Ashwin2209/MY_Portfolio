import React, { useState, useEffect, useRef } from 'react';

const getLanguageColor = (lang) => {
  const colors = {
    JavaScript: "#f1e05a",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Python: "#3572A5",
    Java: "#b07219",
    Vue: "#41b883",
    TypeScript: "#3178c6"
  };
  return colors[lang] || "#8b949e";
};

function App() {
  const [isSiteLoading, setIsSiteLoading] = useState(true);
  const [redirectingUrl, setRedirectingUrl] = useState(null);
  const [typewriterText, setTypewriterText] = useState("");
  const [activeCert, setActiveCert] = useState(null);
  const [statsAnimated, setStatsAnimated] = useState(false);
  const [counters, setCounters] = useState({ projects: 0, technologies: 0, contributions: 0, experience: 0 });
  const [gitStats, setGitStats] = useState({
    projects: 5,
    contributions: 67,
    followers: 2,
    stars: 0,
    reposList: [],
    isLoading: true
  });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Initializing systems...");
  const cursorDotRef = useRef(null);

  // --- GitHub Data Fetching ---
  useEffect(() => {
    const fetchGitData = async () => {
      try {
        setLoadingStatus("Connecting to GitHub Core API...");
        const profilePromise = fetch("https://api.github.com/users/Ashwin2209");
        
        setLoadingStatus("Retrieving repository catalog...");
        const reposPromise = fetch("https://api.github.com/users/Ashwin2209/repos");
        
        setLoadingStatus("Parsing contribution history...");
        const contribPromise = fetch("https://github-contributions-api.jogruber.de/v4/Ashwin2209");

        const [profileRes, reposRes, contribRes] = await Promise.all([
          profilePromise.catch(() => null),
          reposPromise.catch(() => null),
          contribPromise.catch(() => null)
        ]);

        let profileData = {};
        if (profileRes && profileRes.ok) {
          profileData = await profileRes.json();
        }

        let reposData = [];
        if (reposRes && reposRes.ok) {
          reposData = await reposRes.json();
        }

        let contribData = {};
        if (contribRes && contribRes.ok) {
          contribData = await contribRes.json();
        }

        let totalContribs = 67; // fallback
        if (contribData && contribData.total) {
          totalContribs = Object.values(contribData.total).reduce((a, b) => a + b, 0);
        }

        let totalStars = 0;
        let formattedRepos = [];
        if (Array.isArray(reposData)) {
          totalStars = reposData.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
          formattedRepos = reposData
            .filter(repo => !repo.fork)
            .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
            .slice(0, 6);
        }

        setGitStats({
          projects: profileData.public_repos || 5,
          contributions: totalContribs,
          followers: profileData.followers || 2,
          stars: totalStars,
          reposList: formattedRepos,
          isLoading: false
        });
      } catch (err) {
        console.error("Error fetching github stats:", err);
        setGitStats(prev => ({ ...prev, isLoading: false }));
      } finally {
        setLoadingStatus("Ready!");
        setLoadingProgress(100);
        setTimeout(() => {
          setIsSiteLoading(false);
        }, 500);
      }
    };
    fetchGitData();
  }, []);
  const cursorOutlineRef = useRef(null);
  const canvasRef = useRef(null);
  const statsRef = useRef(null);
  const typeIndexRef = useRef({ wordIndex: 0, charIndex: 0, isDeleting: false });
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2, radius: 150 });

  // --- Loading Screen Hook ---
  useEffect(() => {
    if (!isSiteLoading) return;
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      if (currentProgress < 90) {
        currentProgress += Math.floor(Math.random() * 4) + 1;
        if (currentProgress > 90) currentProgress = 90;
        setLoadingProgress(currentProgress);
        
        if (currentProgress < 25) {
          setLoadingStatus("Establishing secure handshake...");
        } else if (currentProgress < 50) {
          setLoadingStatus("Connecting to GitHub Core API...");
        } else if (currentProgress < 75) {
          setLoadingStatus("Retrieving public contributions...");
        } else {
          setLoadingStatus("Preparing landing interface...");
        }
      }
    }, 45);

    // Fallback backup timer: 4.5 seconds
    const backupTimer = setTimeout(() => {
      setLoadingStatus("Connection timeout - running local version...");
      setLoadingProgress(100);
      setTimeout(() => {
        setIsSiteLoading(false);
      }, 500);
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(backupTimer);
    };
  }, [isSiteLoading]);

  // --- Project Click Handler ---
  const handleProjectClick = (e, url) => {
    e.preventDefault();
    setRedirectingUrl(url);
    setTimeout(() => {
      window.open(url, "_blank");
      setRedirectingUrl(null);
    }, 2000);
  };

  // --- Always Dark Theme ---
  useEffect(() => {
    document.body.classList.add('dark-theme');
  }, []);

  // --- Scroll Reveal Logic ---
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        } else {
          entry.target.classList.remove("active");
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach(el => observer.observe(el));
    return () => reveals.forEach(el => observer.unobserve(el));
  }, [gitStats.isLoading]);

  // --- Custom Cursor Logic ---
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

    const interactiveElements = document.querySelectorAll('a, button, .card-custom, .about_me_card, .social-link, .achievement-card, .stat-pill');
    const addHover = () => document.body.classList.add('hovering');
    const removeHover = () => document.body.classList.remove('hovering');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', addHover);
      el.addEventListener('mouseleave', removeHover);
    });

    const parallaxElements = document.querySelectorAll('.parallax-element');
    const onParallaxMove = (e) => {
      parallaxElements.forEach((el) => {
        const speed = el.getAttribute('data-parallax') || 0.05;
        const x = (window.innerWidth - e.pageX * speed) / 100;
        const y = (window.innerHeight - e.pageY * speed) / 100;
        el.style.transform = `translateX(${x}px) translateY(${y}px)`;
      });
    };
    window.addEventListener('mousemove', onParallaxMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
      });
      window.removeEventListener('mousemove', onParallaxMove);
    };
  }, []);

  // --- Typewriter Logic ---
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

  // --- Canvas Particles (Holographic Nodes) ---
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
      constructor(x, y, dx, dy, size, color, isHollow) {
        this.x = x; this.y = y; this.dx = dx; this.dy = dy;
        this.size = size;
        this.color = color;
        this.isHollow = isHollow;
        this.baseX = x; this.baseY = y;
        this.opacity = 0.15;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.globalAlpha = this.opacity;

        if (this.isHollow) {
          ctx.strokeStyle = this.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = this.color;
          ctx.shadowBlur = this.opacity > 0.5 ? 15 : 0;
          ctx.shadowColor = this.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1.0;
      }

      update() {
        if (this.x > canvas.width || this.x < 0) this.dx = -this.dx;
        if (this.y > canvas.height || this.y < 0) this.dy = -this.dy;

        let dxMouse = mouseRef.current.x - this.x;
        let dyMouse = mouseRef.current.y - this.y;
        let distance = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        let interactiveRadius = 200;

        if (distance < interactiveRadius) {
          this.opacity = 1.0 - (distance / interactiveRadius) * 0.5;
          let forceDirectionX = dxMouse / distance;
          let forceDirectionY = dyMouse / distance;
          let force = (interactiveRadius - distance) / interactiveRadius;
          let directionX = forceDirectionX * force * 12;
          let directionY = forceDirectionY * force * 12;
          this.x -= directionX;
          this.y -= directionY;
        } else {
          if (this.opacity > 0.15) this.opacity -= 0.02;
          if (this.x !== this.baseX) {
            let dxBase = this.x - this.baseX;
            this.x -= dxBase / 30;
          }
          if (this.y !== this.baseY) {
            let dyBase = this.y - this.baseY;
            this.y -= dyBase / 30;
          }
        }

        this.x += this.dx;
        this.y += this.dy;
        this.baseX += this.dx * 0.4;
        this.baseY += this.dy * 0.4;
        this.draw();
      }
    }

    const initParticles = () => {
      particlesArray = [];
      const numberOfParticles = (canvas.height * canvas.width) / 12000;
      const root = document.documentElement;
      const color = getComputedStyle(root).getPropertyValue('--primary').trim() || '#00f0ff';

      for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 3) + 1.5;
        let x = Math.random() * innerWidth;
        let y = Math.random() * innerHeight;
        let dx = (Math.random() * 1) - 0.5;
        let dy = (Math.random() * 1) - 0.5;
        let isHollow = Math.random() > 0.6;
        particlesArray.push(new Particle(x, y, dx, dy, size, color, isHollow));
      }
    };

    const animateCanvas = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      animationFrameId = requestAnimationFrame(animateCanvas);
    };

    resize();
    window.addEventListener('resize', resize);
    animateCanvas();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- Stats Counter Animation ---
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !statsAnimated) {
        setStatsAnimated(true);
      }
    }, { threshold: 0.3 });

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [statsAnimated]);

  useEffect(() => {
    if (!statsAnimated) return;

    const targets = { 
      projects: gitStats.projects, 
      technologies: 8, 
      contributions: gitStats.contributions, 
      experience: 2 
    };
    const duration = 2000;
    const startTime = performance.now();
    const startValues = { ...counters };

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounters({
        projects: Math.floor(startValues.projects + (targets.projects - startValues.projects) * eased),
        technologies: Math.floor(startValues.technologies + (targets.technologies - startValues.technologies) * eased),
        contributions: Math.floor(startValues.contributions + (targets.contributions - startValues.contributions) * eased),
        experience: Math.floor(startValues.experience + (targets.experience - startValues.experience) * eased),
      });

      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [statsAnimated, gitStats.projects, gitStats.contributions]);

  // --- CV Download ---
  const handleDownloadCV = (e) => {
    e.preventDefault();
    const link = document.createElement('a');
    link.href = '/resume.jpg';
    link.download = 'Ashwinkumar_CV.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Timeline Data ---
  const timelineData = [
    {
      year: "2022",
      title: "Started B.Tech in Information Technology",
      description: "Began pursuing B.Tech IT at Vel Tech Multi Tech Dr. Rangarajan Dr. Sakunthala Engineering College, building foundations in software development, DSA, and web technologies.",
      icon: "fas fa-graduation-cap",
      type: "education"
    },
    {
      year: "Sep 2024",
      title: "Generative AI Mega Workshop 2.0",
      description: "Attended an exclusive workshop hosted by Mr Tezan Sahu, SDE II at Microsoft, conducted by NxtWave CCBP 4.0 Academy.",
      icon: "fas fa-robot",
      type: "achievement"
    },
    {
      year: "Oct 2024",
      title: "Java Programming Certification",
      description: "Successfully completed Java Programming course from Great Learning Academy, strengthening OOP and backend fundamentals.",
      icon: "fas fa-certificate",
      type: "certification"
    },
    {
      year: "Dec 2024",
      title: "AI Internship — Top Tech Developers",
      description: "Completed an internship in the Artificial Intelligence domain at Top Tech Developers, Chennai (Dec 6–24, 2024).",
      icon: "fas fa-briefcase",
      type: "experience"
    },
    {
      year: "Mar 2025",
      title: "GENOVATE'25 — Project Expo",
      description: "Participated in GENOVATE'25, a department-wide Project Expo organized by the Department of IT at Vel Tech.",
      icon: "fas fa-project-diagram",
      type: "achievement"
    },
    {
      year: "Mar 2025",
      title: "Literary Lens — 1st Prize 🏆",
      description: "Won 1st prize in the Literary Lens event at Literary Fest, organized by the Chaucerian English Club.",
      icon: "fas fa-trophy",
      type: "achievement"
    },
    {
      year: "Present",
      title: "4th Year — Building the Future",
      description: "Currently in final year, actively building full-stack projects and seeking full-time opportunities to create impactful digital products.",
      icon: "fas fa-rocket",
      type: "current"
    }
  ];

  // --- Certificates Data ---
  const certificatesData = [
    {
      id: 1,
      title: "AI Internship Completion",
      org: "Top Tech Developers, Chennai",
      date: "December 2024",
      description: "Completed internship in Artificial Intelligence domain.",
      image: "/cert-internship.jpg",
      icon: "fas fa-briefcase"
    },
    {
      id: 2,
      title: "GENOVATE'25 — Project Expo",
      org: "Vel Tech Multi Tech, Dept. of IT",
      date: "March 2025",
      description: "Participated in department-wide Project Expo.",
      image: "/cert-genovate.jpg",
      icon: "fas fa-project-diagram"
    },
    {
      id: 3,
      title: "Literary Lens — 1st Prize",
      org: "Chaucerian English Club",
      date: "March 2025",
      description: "Won 1st prize at Literary Fest event.",
      image: "/cert-literary.jpg",
      icon: "fas fa-trophy"
    },
    {
      id: 4,
      title: "Java Programming",
      org: "Great Learning Academy",
      date: "October 2024",
      description: "Completed Java Programming online course.",
      image: "/cert-java.jpg",
      icon: "fas fa-code"
    },
    {
      id: 5,
      title: "Generative AI Workshop 2.0",
      org: "NxtWave CCBP 4.0 Academy",
      date: "September 2024",
      description: "Workshop hosted by Mr Tezan Sahu, SDE II at Microsoft.",
      image: "/cert-genai.jpg",
      icon: "fas fa-robot"
    }
  ];

  return (
    <>
      {/* ===== LOADER ===== */}
      <div className={`loader-overlay ${!isSiteLoading && !redirectingUrl ? 'hidden' : ''}`}>
        {redirectingUrl ? (
          <div className="text-center">
            <div className="custom-loader"></div>
            <h2 className="loader-text mt-4">Opening Project Data...</h2>
          </div>
        ) : (
          <div className="loader-progress-wrap text-center">
            <h1 className="loader-brand mb-3">Ashwinkumar.</h1>
            <div className="loader-progress-bar-bg mx-auto mb-3">
              <div className="loader-progress-bar-fill" style={{ width: `${loadingProgress}%` }}></div>
            </div>
            <div className="loader-status text-muted mb-2">{loadingStatus}</div>
            <div className="loader-percent">{loadingProgress}%</div>
          </div>
        )}
      </div>

      {/* ===== CERTIFICATE LIGHTBOX ===== */}
      {activeCert && (
        <div className="cert-lightbox" onClick={() => setActiveCert(null)}>
          <div className="cert-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="cert-lightbox-close" onClick={() => setActiveCert(null)}>
              <i className="fas fa-times"></i>
            </button>
            <img src={activeCert.image} alt={activeCert.title} />
            <div className="cert-lightbox-info">
              <h3>{activeCert.title}</h3>
              <p>{activeCert.org} &bull; {activeCert.date}</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== CUSTOM CURSOR ===== */}
      <div className="cursor-dot" ref={cursorDotRef} data-cursor-dot></div>
      <div className="cursor-outline" ref={cursorOutlineRef} data-cursor-outline></div>

      <canvas id="canvas-bg" ref={canvasRef}></canvas>

      {/* ===== NAVBAR ===== */}
      <nav className="navbar navbar-expand-lg fixed-top navbar-animate">
        <div className="container">
          <a className="navbar-brand" href="#">Ashwinkumar.</a>
          <div className="d-flex align-items-center order-lg-3 ms-lg-3">
            <button className="navbar-toggler ms-2 shadow-none border-0" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
              <i className="fas fa-bars" style={{ color: 'var(--text-main)' }}></i>
            </button>
          </div>
          <div className="collapse navbar-collapse" id="nav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item"><a className="nav-link mx-2" href="#about">About</a></li>
              <li className="nav-item"><a className="nav-link mx-2" href="#skills">Skills</a></li>
              <li className="nav-item"><a className="nav-link mx-2" href="#projects">Work</a></li>
              <li className="nav-item"><a className="nav-link mx-2" href="#achievements">Achievements</a></li>
              <li className="nav-item"><a className="nav-link mx-2" href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="hero-section parallax-container">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 parallax-element" data-parallax="5">
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
                <a href="/resume.jpg" className="btn btn-outline-custom" onClick={handleDownloadCV}><i className="fas fa-download me-2"></i>CV</a>
              </div>
            </div>
            <div className="col-lg-6 text-center animate-hero delay-200 parallax-element" data-parallax="-4">
              <img src="/hero.jpg" alt="Profile" className="profile-img" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== ABOUT ME ===== */}
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
                <p>I am currently pursuing a B.Tech in Information Technology at Vel Tech Multi Tech Dr. Rangarajan Dr. Sakunthala Engineering College, building a strong foundation in software development, data structures, algorithms, databases, networking, and modern web technologies.</p>
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

      {/* ===== SKILLS ===== */}
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
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" alt="Java" className="skill-logo" />
                <h5 className="mt-2">Java</h5>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3 reveal reveal-left">
              <div className="card-custom text-center py-4">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg" alt="Bootstrap" className="skill-logo" />
                <h5 className="mt-2">Bootstrap</h5>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3 reveal reveal-bottom">
              <div className="card-custom text-center py-4">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="GitHub" className="skill-logo" />
                <h5 className="mt-2">GitHub</h5>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3 reveal reveal-top">
              <div className="card-custom text-center py-4">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" alt="Figma" className="skill-logo" />
                <h5 className="mt-2">Figma</h5>
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

      {/* ===== STATS COUNTER BAR ===== */}
      <section className="stats-section" ref={statsRef}>
        <div className="container">
          <div className="stats-bar">
            <div className="stat-counter-item">
              <div className="stat-number-wrap">
                <span className="stat-number">{counters.projects}</span>
                <span className="stat-plus">+</span>
              </div>
              <span className="stat-label">Projects Completed</span>
            </div>
            <div className="stat-counter-item">
              <div className="stat-number-wrap">
                <span className="stat-number">{counters.technologies}</span>
                <span className="stat-plus">+</span>
              </div>
              <span className="stat-label">Technologies</span>
            </div>
            <div className="stat-counter-item">
              <div className="stat-number-wrap">
                <span className="stat-number">{counters.contributions}</span>
                <span className="stat-plus">+</span>
              </div>
              <span className="stat-label">GitHub Contributions</span>
            </div>
            <div className="stat-counter-item">
              <div className="stat-number-wrap">
                <span className="stat-number">{counters.experience}</span>
                <span className="stat-plus">+</span>
              </div>
              <span className="stat-label">Years Coding</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== GITHUB ANALYTICS ===== */}
      <section className="github-analytics-section section-padding">
        <div className="container">
          <div className="mb-5 text-center reveal reveal-zoom">
            <h2>GitHub Analytics</h2>
            <div className="divider mx-auto"></div>
            <p className="text-muted">Real-time statistics fetched from GitHub API</p>
          </div>

          <div className="row g-4 mb-5 justify-content-center">
            <div className="col-6 col-md-3 reveal reveal-left">
              <div className="git-metric-card text-center">
                <div className="git-metric-icon"><i className="fas fa-code-branch"></i></div>
                <h3 className="git-metric-value">{gitStats.isLoading ? <span className="spinner-border spinner-border-sm text-secondary"></span> : gitStats.projects}</h3>
                <p className="git-metric-label">Repositories</p>
              </div>
            </div>
            
            <div className="col-6 col-md-3 reveal reveal-top">
              <div className="git-metric-card text-center">
                <div className="git-metric-icon"><i className="fas fa-history"></i></div>
                <h3 className="git-metric-value">{gitStats.isLoading ? <span className="spinner-border spinner-border-sm text-secondary"></span> : gitStats.contributions}</h3>
                <p className="git-metric-label">Total Commits</p>
              </div>
            </div>

            <div className="col-6 col-md-3 reveal reveal-bottom">
              <div className="git-metric-card text-center">
                <div className="git-metric-icon"><i className="fas fa-users"></i></div>
                <h3 className="git-metric-value">{gitStats.isLoading ? <span className="spinner-border spinner-border-sm text-secondary"></span> : gitStats.followers}</h3>
                <p className="git-metric-label">Followers</p>
              </div>
            </div>

            <div className="col-6 col-md-3 reveal reveal-right">
              <div className="git-metric-card text-center">
                <div className="git-metric-icon"><i className="fas fa-star"></i></div>
                <h3 className="git-metric-value">{gitStats.isLoading ? <span className="spinner-border spinner-border-sm text-secondary"></span> : gitStats.stars}</h3>
                <p className="git-metric-label">Stars Earned</p>
              </div>
            </div>
          </div>

          {/* Heatmap Graph */}
          <div className="row mb-5 reveal reveal-zoom">
            <div className="col-12">
              <div className="git-heatmap-container p-4 text-center">
                <h4 className="mb-4 text-start"><i className="fab fa-github me-2"></i>Contributions Calendar</h4>
                <div className="git-heatmap-scroll">
                  <img 
                    src="https://ghchart.rshah.org/a3b8cc/Ashwin2209" 
                    alt="Ashwin's GitHub Contributions Calendar" 
                    className="git-heatmap-img"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Repositories from GitHub */}
          <div className="reveal reveal-bottom">
            <div className="git-repos-header d-flex justify-content-between align-items-center mb-4">
              <h4 className="m-0"><i className="fas fa-folder-open me-2"></i>Active Repositories</h4>
              <a href="https://github.com/Ashwin2209" target="_blank" rel="noreferrer" className="btn btn-outline-custom btn-sm">
                View Profile <i className="fas fa-external-link-alt ms-1"></i>
              </a>
            </div>
            
            <div className="row g-4">
              {gitStats.isLoading ? (
                [1, 2, 3].map(n => (
                  <div key={n} className="col-md-4 col-sm-6">
                    <div className="git-repo-card loading-card">
                      <div className="skeleton-line title"></div>
                      <div className="skeleton-line desc"></div>
                      <div className="skeleton-line footer"></div>
                    </div>
                  </div>
                ))
              ) : gitStats.reposList.length === 0 ? (
                <div className="col-12 text-center py-4">
                  <p className="text-muted">No repositories found or API rate limit exceeded.</p>
                </div>
              ) : (
                gitStats.reposList.map(repo => (
                  <div key={repo.id} className="col-md-4 col-sm-6">
                    <div className="git-repo-card">
                      <div className="git-repo-header d-flex justify-content-between align-items-start">
                        <h5 className="git-repo-title">{repo.name}</h5>
                        <a href={repo.html_url} target="_blank" rel="noreferrer" className="git-repo-link">
                          <i className="fab fa-github"></i>
                        </a>
                      </div>
                      <p className="git-repo-desc">
                        {repo.description || "No description provided."}
                      </p>
                      <div className="git-repo-footer d-flex justify-content-between align-items-center mt-3">
                        <span className="git-repo-lang">
                          <span className="lang-dot" style={{ backgroundColor: getLanguageColor(repo.language) }}></span>
                          {repo.language || "Plain Text"}
                        </span>
                        <span className="git-repo-stars">
                          <i className="fas fa-star me-1 text-warning"></i>{repo.stargazers_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROJECTS ===== */}
      <section id="projects" className="section-padding">
        <div className="container">
          <div className="mb-5 text-center reveal reveal-zoom">
            <h2>Featured Projects</h2>
            <div className="divider mx-auto"></div>
          </div>
          <div className="row g-4">

            {/* My World */}
            <div className="col-lg-4 col-md-6 reveal reveal-left">
              <div className="project-card">
                <div className="project-thumb-wrap">
                  <img src="/thumb-portfolio.jpg" alt="My World portfolio preview" className="project-thumb" />
                  <div className="project-thumb-overlay">
                    <a href="#" onClick={(e) => handleProjectClick(e, "https://tinyurl.com/my-w0rld")} className="thumb-btn">Live Demo <i className="fas fa-external-link-alt ms-1"></i></a>
                    <a href="#" onClick={(e) => handleProjectClick(e, "https://github.com/Ashwin2209/MY_Portfolio")} className="thumb-btn thumb-btn-sec">Code <i className="fas fa-arrow-right ms-1"></i></a>
                  </div>
                </div>
                <div className="project-card-body">
                  <h4>My World</h4>
                  <div className="project-tags">
                    <span className="tech-tag">React.js</span>
                    <span className="tech-tag">Vite</span>
                    <span className="tech-tag">Canvas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Foodie Spot */}
            <div className="col-lg-4 col-md-6 reveal reveal-zoom">
              <div className="project-card">
                <div className="project-thumb-wrap">
                  <img src="/thumb-foodie.jpg" alt="Foodie Spot preview" className="project-thumb" />
                  <div className="project-thumb-overlay">
                    <a href="#" onClick={(e) => handleProjectClick(e, "https://foodiespot-menu.vercel.app")} className="thumb-btn">Live Demo <i className="fas fa-external-link-alt ms-1"></i></a>
                    <a href="#" onClick={(e) => handleProjectClick(e, "https://github.com/Ashwin2209/Food-menu")} className="thumb-btn thumb-btn-sec">Code <i className="fas fa-arrow-right ms-1"></i></a>
                  </div>
                </div>
                <div className="project-card-body">
                  <h4>Foodie Spot</h4>
                  <div className="project-tags">
                    <span className="tech-tag">React.js</span>
                    <span className="tech-tag">JavaScript</span>
                    <span className="tech-tag">CSS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ResumeForge */}
            <div className="col-lg-4 col-md-6 reveal reveal-right">
              <div className="project-card">
                <div className="project-thumb-wrap">
                  <img src="/thumb-resume.jpg" alt="ResumeForge preview" className="project-thumb" />
                  <div className="project-thumb-overlay">
                    <a href="#" onClick={(e) => handleProjectClick(e, "https://tinyurl.com/resume2ak")} className="thumb-btn">Live Demo <i className="fas fa-external-link-alt ms-1"></i></a>
                    <a href="#" onClick={(e) => handleProjectClick(e, "https://github.com/Ashwin2209/Resume")} className="thumb-btn thumb-btn-sec">Code <i className="fas fa-arrow-right ms-1"></i></a>
                  </div>
                </div>
                <div className="project-card-body">
                  <h4>ResumeForge</h4>
                  <div className="project-tags">
                    <span className="tech-tag">React.js</span>
                    <span className="tech-tag">AI/ATS</span>
                    <span className="tech-tag">Vite</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FuncBox */}
            <div className="col-lg-4 col-md-6 reveal reveal-left">
              <div className="project-card">
                <div className="project-thumb-wrap">
                  <img src="/thumb-funcbox.jpg" alt="FuncBox documentation preview" className="project-thumb" />
                  <div className="project-thumb-overlay">
                    <a href="#" onClick={(e) => handleProjectClick(e, "https://funcbox-web.vercel.app")} className="thumb-btn">Live Demo <i className="fas fa-external-link-alt ms-1"></i></a>
                    <a href="#" onClick={(e) => handleProjectClick(e, "https://github.com/funcBox-i3/funcBox-web")} className="thumb-btn thumb-btn-sec">Code <i className="fas fa-arrow-right ms-1"></i></a>
                  </div>
                </div>
                <div className="project-card-body">
                  <h4>FuncBox</h4>
                  <div className="project-tags">
                    <span className="tech-tag">React.js</span>
                    <span className="tech-tag">Vite</span>
                    <span className="tech-tag">Python</span>
                    <span className="tech-tag">Java</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FixMyCity — no thumbnail */}
            <div className="col-lg-4 col-md-6 reveal reveal-zoom">
              <div className="project-card">
                <div className="project-thumb-wrap project-no-thumb">
                  <div className="project-no-thumb-inner">
                    <i className="fas fa-city project-no-thumb-icon"></i>
                    <p>Automated grievance system that generates formal letters and handles email dispatching.</p>
                  </div>
                  <div className="project-thumb-overlay">
                    <a href="#" onClick={(e) => handleProjectClick(e, "https://github.com/Ashwin2209/FixMyCity")} className="thumb-btn">View Code <i className="fas fa-arrow-right ms-1"></i></a>
                  </div>
                </div>
                <div className="project-card-body">
                  <h4>FixMyCity</h4>
                  <div className="project-tags">
                    <span className="tech-tag">Python</span>
                    <span className="tech-tag">Automation</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== ACHIEVEMENTS & CERTIFICATIONS ===== */}
      <section id="achievements" className="section-padding">
        <div className="container">
          <div className="mb-5 text-center reveal reveal-zoom">
            <h2>Achievements & Certifications</h2>
            <div className="divider mx-auto"></div>
          </div>
          <div className="row g-4">
            {certificatesData.map((cert, index) => (
              <div
                key={cert.id}
                className={`col-lg-4 col-md-6 reveal ${['reveal-left', 'reveal-zoom', 'reveal-right'][index % 3]}`}
              >
                <div className="achievement-card" onClick={() => setActiveCert(cert)}>
                  <div className="achievement-icon-wrap">
                    <i className={cert.icon}></i>
                  </div>
                  <h4>{cert.title}</h4>
                  <p className="achievement-org">{cert.org}</p>
                  <p className="achievement-desc">{cert.description}</p>
                  <div className="achievement-footer">
                    <span className="achievement-date">
                      <i className="far fa-calendar-alt me-2"></i>{cert.date}
                    </span>
                    <span className="achievement-view-btn">
                      View Certificate <i className="fas fa-arrow-right ms-1"></i>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
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

      {/* ===== FOOTER ===== */}
      <footer className="footer-minimal">
        <div className="container">
          <small>&copy; 2025 Ashwinkumar. Built with Professionalism &amp; React.</small>
        </div>
      </footer>
    </>
  );
}

export default App;
