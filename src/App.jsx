import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ── helpers ── */
const getLanguageColor = (lang) => {
  const colors = {
    JavaScript:"#f1e05a",HTML:"#e34c26",CSS:"#563d7c",
    Python:"#3572A5",Java:"#b07219",Vue:"#41b883",TypeScript:"#3178c6",
  };
  return colors[lang] || "#8b949e";
};

/* ── Curated opening quotes and engineering philosophy ── */
const LOADER_QUOTES = [
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Simplicity is prerequisite for reliability.", author: "Edsger W. Dijkstra" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" }
];

/* ══════════════════════════════════════════════════════
   APP
   ══════════════════════════════════════════════════════ */
function App() {
  const [isSiteLoading, setIsSiteLoading]     = useState(true);
  const [redirectingUrl, setRedirectingUrl]   = useState(null);
  const [typewriterText, setTypewriterText]   = useState("");
  const [activeCert, setActiveCert]           = useState(null);
  const [statsAnimated, setStatsAnimated]     = useState(false);
  const [counters, setCounters]               = useState({ projects:0, technologies:0, contributions:0, experience:0 });
  const [menuOpen, setMenuOpen]               = useState(false);
  const [isScrolled, setIsScrolled]           = useState(false);
  const [scrollProgress, setScrollProgress]   = useState(0);
  const [activeSection, setActiveSection]     = useState('');
  const [gitStats, setGitStats]               = useState({
    projects:5, contributions:67, followers:2, stars:0,
    reposList:[], isLoading:true,
  });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus]     = useState("Initializing...");
  const [loaderQuote, setLoaderQuote]         = useState(0);
  const [quoteVisible, setQuoteVisible]       = useState(true);

  const cursorDotRef     = useRef(null);
  const cursorOutlineRef = useRef(null);
  const statsRef         = useRef(null);
  const heroBgRef        = useRef(null);
  const typeIndexRef     = useRef({ wordIndex:0, charIndex:0, isDeleting:false });
  const mouseRef         = useRef({ x: typeof window!=="undefined"?window.innerWidth/2:0,
                                    y: typeof window!=="undefined"?window.innerHeight/2:0 });
  const lastScrollY      = useRef(0);
  const scrollVelRef     = useRef(0);
  const scrollRafRef     = useRef(null);

  /* ── GitHub data ── */
  useEffect(() => {
    const MIN_DISPLAY_MS = 3800; // loader always visible for at least this long
    const startTime = Date.now();

    const fetchGitData = async () => {
      try {
        const [profileRes, reposRes, contribRes] = await Promise.all([
          fetch("https://api.github.com/users/Ashwin2209").catch(()=>null),
          fetch("https://api.github.com/users/Ashwin2209/repos").catch(()=>null),
          fetch("https://github-contributions-api.jogruber.de/v4/Ashwin2209").catch(()=>null),
        ]);
        let profileData={}, reposData=[], contribData={};
        if(profileRes?.ok) profileData = await profileRes.json();
        if(reposRes?.ok)   reposData   = await reposRes.json();
        if(contribRes?.ok) contribData = await contribRes.json();

        let totalContribs = 67;
        if(contribData?.total) totalContribs = Object.values(contribData.total).reduce((a,b)=>a+b,0);
        let totalStars=0, formattedRepos=[];
        if(Array.isArray(reposData)){
          totalStars = reposData.reduce((acc,r)=>acc+(r.stargazers_count||0),0);
          formattedRepos = reposData.filter(r=>!r.fork).sort((a,b)=>new Date(b.pushed_at)-new Date(a.pushed_at)).slice(0,6);
        }
        setGitStats({ projects:profileData.public_repos||5, contributions:totalContribs,
          followers:profileData.followers||2, stars:totalStars, reposList:formattedRepos, isLoading:false });
      } catch(err){ console.error(err); setGitStats(p=>({...p,isLoading:false})); }
      finally {
        // Wait until minimum display time has elapsed before hiding
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
        setTimeout(()=>{
          setLoadingStatus("Ready!");
          setLoadingProgress(100);
          setTimeout(()=>setIsSiteLoading(false), 700);
        }, remaining);
      }
    };
    fetchGitData();
  },[]);

  /* ── Cycle quotes smoothly ── */
  useEffect(()=>{
    if(!isSiteLoading) return;
    const cycle = setInterval(()=>{
      setQuoteVisible(false);
      setTimeout(()=>{
        setLoaderQuote(q => (q + 1) % LOADER_QUOTES.length);
        setQuoteVisible(true);
      }, 350);
    }, 1600);
    return () => clearInterval(cycle);
  },[isSiteLoading]);

  /* ── Smooth progress increment (0% to 100% over ~2.8s) ── */
  useEffect(()=>{
    if(!isSiteLoading) return;
    let cur = 0;
    const startTime = Date.now();
    const duration = 2800; // 2.8s to hit 100%

    const iv = setInterval(()=>{
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setLoadingProgress(progress);

      if (progress < 25) {
        setLoadingStatus("ARCHITECTING CANVAS...");
      } else if (progress < 55) {
        setLoadingStatus("COMPILING DIGITAL ARTIFACTS...");
      } else if (progress < 85) {
        setLoadingStatus("CALIBRATING INTERACTIONS...");
      } else if (progress < 100) {
        setLoadingStatus("FINALIZING EXPERIENCE...");
      } else {
        setLoadingStatus("WELCOME — EXPERIENCE READY");
      }

      if (progress >= 100) {
        clearInterval(iv);
      }
    }, 40);

    return () => clearInterval(iv);
  },[isSiteLoading]);


  /* ── Scrollytelling observer ── */
  useEffect(()=>{
    const stlEls = document.querySelectorAll('.stl-up,.stl-left,.stl-right,.stl-scale,.stl-fade,.stl-flip');
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('stl-visible'); });
    },{ threshold: 0.04, rootMargin: '0px 0px -30px 0px' });
    stlEls.forEach(el=>observer.observe(el));
    return ()=>observer.disconnect();
  },[gitStats.isLoading]);

  /* ── Active section observer (for nav highlight) ── */
  useEffect(()=>{
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting) setActiveSection(e.target.id);
      });
    },{ threshold: 0.3 });
    sections.forEach(s=>observer.observe(s));
    return ()=>observer.disconnect();
  },[]);

  /* ── Scroll: progress + navbar + parallax + velocity ── */
  useEffect(()=>{
    let rafId;
    const handleScroll = ()=>{
      if(rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(()=>{
        const scrollY   = window.scrollY;
        const docH      = document.documentElement.scrollHeight - window.innerHeight;
        const progress  = docH > 0 ? (scrollY / docH) * 100 : 0;

        // Scroll progress bar
        setScrollProgress(progress);

        // Navbar scroll state
        setIsScrolled(scrollY > 60);

        // Scroll velocity
        scrollVelRef.current = scrollY - lastScrollY.current;
        lastScrollY.current  = scrollY;

        // ── Hero image parallax ──
        // The image has scale(1.15) in CSS giving room to drift without showing edges.
        // JS owns the transform completely (no CSS animation on the img).
        if(heroBgRef.current){
          const heroH    = window.innerHeight;
          const progress = Math.min(scrollY / heroH, 1); // 0→1 as hero scrolls out

          // Vertical drift — drifts upward as you scroll down
          const driftY   = scrollY * 0.38;

          // Subtle horizontal sway — image gently shifts left as you scroll
          const driftX   = scrollY * -0.015;

          // Scale slightly back in from 1.15 as hero leaves view (stays ≥ 1.08)
          const scale    = 1.15 - progress * 0.07;

          // Brightness dims slightly as hero scrolls away
          const bright   = 1 - progress * 0.25;

          heroBgRef.current.style.transform =
            `translate3d(${driftX}px, ${driftY}px, 0) scale(${scale})`;
          heroBgRef.current.style.filter =
            `brightness(${bright})`;
        }

        // Parallax project thumbnails
        const thumbs = document.querySelectorAll(".project-thumb");
        const vCenter = window.innerHeight / 2;
        thumbs.forEach(t=>{
          const rect = t.parentElement.getBoundingClientRect();
          const elCenter = rect.top + rect.height / 2;
          const offset = ((elCenter - vCenter) / vCenter) * -14;
          t.style.setProperty("--parallax-y", `${offset}px`);
        });

        // Subtle scroll velocity tilt on glass cards visible in viewport
        const vel = Math.max(-1, Math.min(1, scrollVelRef.current / 30));
        const cards = document.querySelectorAll('.scroll-tilt-wrap');
        cards.forEach(c=>{
          const rect = c.getBoundingClientRect();
          if(rect.top > 0 && rect.bottom < window.innerHeight){
            c.style.transform = `perspective(1200px) rotateX(${vel * 1.5}deg)`;
          }
        });
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return ()=>{
      window.removeEventListener("scroll", handleScroll);
      if(rafId) cancelAnimationFrame(rafId);
    };
  },[]);

  /* ── Smooth cursor ── */
  useEffect(()=>{
    const dot = cursorDotRef.current, outline = cursorOutlineRef.current;
    let ox = mouseRef.current.x, oy = mouseRef.current.y, rafId;

    const onMove = e=>{
      mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY;
      if(dot){ dot.style.left=`${e.clientX}px`; dot.style.top=`${e.clientY}px`; }
    };
    const animate = ()=>{
      ox += (mouseRef.current.x - ox) * 0.11; oy += (mouseRef.current.y - oy) * 0.11;
      if(outline){ outline.style.left=`${ox}px`; outline.style.top=`${oy}px`; }
      rafId = requestAnimationFrame(animate);
    };
    window.addEventListener("mousemove", onMove);
    animate();

    const INTERACTIVE = 'a, button, .glass-card, .social-link, .project-card, .skill-card, .achievement-card, .project-thumb-wrap, .mag-btn, .thumb-btn';
    const onOver = e=>{ if(e.target.closest(INTERACTIVE)) document.body.classList.add('hovering'); };
    const onOut  = e=>{ if(!e.relatedTarget?.closest(INTERACTIVE)) document.body.classList.remove('hovering'); };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout',  onOut);

    return ()=>{
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
    };
  },[]);

  /* ── Typewriter ── */
  useEffect(()=>{
    const words=["Turning ideas into digital solutions.","Building the future, one line at a time.",
      "Designing with purpose.","Code & Creativity.","Young. Focused. Fearless."];
    let tid;
    const tick=()=>{
      const {wordIndex,charIndex,isDeleting}=typeIndexRef.current;
      const word=words[wordIndex]; let speed=100;
      if(isDeleting){setTypewriterText(word.substring(0,charIndex-1));typeIndexRef.current.charIndex--;speed=40;}
      else{setTypewriterText(word.substring(0,charIndex+1));typeIndexRef.current.charIndex++;speed=100;}
      if(!isDeleting&&typeIndexRef.current.charIndex===word.length){typeIndexRef.current.isDeleting=true;speed=2200;}
      else if(isDeleting&&typeIndexRef.current.charIndex===0){
        typeIndexRef.current.isDeleting=false;
        typeIndexRef.current.wordIndex=(wordIndex+1)%words.length; speed=500;
      }
      tid=setTimeout(tick,speed);
    };
    const start=setTimeout(tick,1800);
    return ()=>{clearTimeout(tid);clearTimeout(start);};
  },[]);

  /* ── Stats counter ── */
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting&&!statsAnimated)setStatsAnimated(true);},{threshold:0.3});
    if(statsRef.current) obs.observe(statsRef.current);
    return ()=>obs.disconnect();
  },[statsAnimated]);

  useEffect(()=>{
    if(!statsAnimated) return;
    const targets={projects:gitStats.projects,technologies:8,contributions:gitStats.contributions,experience:2};
    const duration=2200; const start=performance.now(); const init={...counters};
    const frame=now=>{
      const t=Math.min((now-start)/duration,1); const ease=1-Math.pow(1-t,3);
      setCounters({
        projects:Math.floor(init.projects+(targets.projects-init.projects)*ease),
        technologies:Math.floor(init.technologies+(targets.technologies-init.technologies)*ease),
        contributions:Math.floor(init.contributions+(targets.contributions-init.contributions)*ease),
        experience:Math.floor(init.experience+(targets.experience-init.experience)*ease),
      });
      if(t<1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  },[statsAnimated,gitStats.projects,gitStats.contributions]);

  /* ── Handlers ── */
  const handleProjectClick=(e,url)=>{
    e.preventDefault(); setRedirectingUrl(url);
    setTimeout(()=>{window.open(url,"_blank");setRedirectingUrl(null);},2000);
  };
  const handleDownloadCV=e=>{
    e.preventDefault();
    const a=document.createElement("a"); a.href="/resume.jpg"; a.download="Ashwinkumar_CV.jpg";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  const handleMagMove=e=>{
    const btn=e.currentTarget; const rect=btn.getBoundingClientRect();
    const dx=e.clientX-(rect.left+rect.width/2); const dy=e.clientY-(rect.top+rect.height/2);
    btn.style.transform=`translate(${dx*0.22}px,${dy*0.22}px)`;
  };
  const handleMagLeave=e=>{e.currentTarget.style.transform="";};
  const closeMenu=()=>setMenuOpen(false);

  /* ── Data ── */
  const certs=[
    {id:1,title:"AI Internship Completion",  org:"Top Tech Developers, Chennai",    date:"December 2024", description:"Completed internship in Artificial Intelligence domain.",        image:"/cert-internship.jpg",icon:"fas fa-briefcase"},
    {id:2,title:"GENOVATE'25 — Project Expo",org:"Vel Tech Multi Tech, Dept. of IT",date:"March 2025",    description:"Participated in department-wide Project Expo.",                 image:"/cert-genovate.jpg",  icon:"fas fa-project-diagram"},
    {id:3,title:"Literary Lens — 1st Prize", org:"Chaucerian English Club",         date:"March 2025",    description:"Won 1st prize at Literary Fest event.",                        image:"/cert-literary.jpg",  icon:"fas fa-trophy"},
    {id:4,title:"Java Programming",           org:"Great Learning Academy",          date:"October 2024",  description:"Completed Java Programming online course.",                    image:"/cert-java.jpg",      icon:"fas fa-code"},
    {id:5,title:"Generative AI Workshop 2.0",org:"NxtWave CCBP 4.0 Academy",       date:"September 2024",description:"Workshop hosted by Mr Tezan Sahu, SDE II at Microsoft.",     image:"/cert-genai.jpg",     icon:"fas fa-robot"},
  ];
  const skills=[
    {name:"React.js",   icon:"react/react-original.svg"},
    {name:"JavaScript", icon:"javascript/javascript-original.svg"},
    {name:"Python",     icon:"python/python-original.svg"},
    {name:"Java",       icon:"java/java-original.svg"},
    {name:"Bootstrap",  icon:"bootstrap/bootstrap-original.svg"},
    {name:"GitHub",     icon:"github/github-original.svg"},
    {name:"Figma",      icon:"figma/figma-original.svg"},
    {name:"MySQL",      icon:"mysql/mysql-original.svg"},
  ];

  /* ══════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════ */
  return (
    <>
      {/* ═══ SCROLL PROGRESS ═══ */}
      <div className="scroll-progress" style={{width:`${scrollProgress}%`}} />

      {/* ═══ LOADER / OPENING SCREEN ═══ */}
      <div className={`loader-overlay${!isSiteLoading&&!redirectingUrl?" hidden":""}`}>
        {redirectingUrl ? (
          /* ─ Redirect state ─ */
          <div className="loader-redirect">
            <div className="loader-redirect-ring">
              <i className="fas fa-arrow-right"></i>
            </div>
            <p className="loader-redirect-label">Opening Project…</p>
          </div>
        ) : (
          /* ─ Editorial Opening Presentation ─ */
          <div className="loader-center">
            {/* Top editorial kicker */}
            <div className="ldr-top-bar">
              <span className="ldr-pulse-dot"></span>
              <span className="ldr-meta">ASHWINKUMAR &bull; PORTFOLIO &bull; {new Date().getFullYear()}</span>
            </div>

            {/* Main Brand Title */}
            <h1 className="ldr-brand-title">
              ASHWIN<span className="ldr-gold">KUMAR</span>
            </h1>

            {/* Sub-label */}
            <p className="ldr-subtitle">FULL STACK DEVELOPER &bull; ARCHITECT &bull; CREATOR</p>

            {/* Elegant Quotation Block */}
            <div className="ldr-quote-container">
              <p className={`ldr-quote-text ${quoteVisible ? 'visible' : 'fading'}`}>
                &ldquo;{(LOADER_QUOTES[loaderQuote] || LOADER_QUOTES[0]).text}&rdquo;
              </p>
              <span className={`ldr-quote-author ${quoteVisible ? 'visible' : 'fading'}`}>
                &mdash; {(LOADER_QUOTES[loaderQuote] || LOADER_QUOTES[0]).author}
              </span>
            </div>

            {/* Progress Bar & Status */}
            <div className="ldr-progress-box">
              <div className="ldr-progress-track">
                <div className="ldr-progress-fill" style={{ width: `${loadingProgress}%` }}></div>
              </div>
              <div className="ldr-progress-meta">
                <span className="ldr-status-text">{loadingStatus}</span>
                <span className="ldr-percent-text">{loadingProgress}%</span>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* ═══ CERT LIGHTBOX ═══ */}
      {activeCert&&(
        <div className="cert-lightbox" onClick={()=>setActiveCert(null)}>
          <div className="cert-lightbox-content" onClick={e=>e.stopPropagation()}>
            <button className="cert-lightbox-close" onClick={()=>setActiveCert(null)}>
              <i className="fas fa-times"></i>
            </button>
            <img src={activeCert.image} alt={activeCert.title}/>
            <div className="cert-lightbox-info">
              <h3>{activeCert.title}</h3>
              <p>{activeCert.org} &bull; {activeCert.date}</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CURSOR ═══ */}
      <div className="cursor-dot" ref={cursorDotRef}></div>
      <div className="cursor-outline" ref={cursorOutlineRef}></div>

      {/* ═══ NAVBAR ═══ */}
      <nav className={`navbar${isScrolled?" scrolled":""}`}>
        <div className="container">
          <a className="navbar-brand" href="#">ASHWIN<span>.</span></a>
          <button className="nav-toggle" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <i className={`fas ${menuOpen?"fa-times":"fa-bars"}`}></i>
          </button>
          <ul className={`nav-menu${menuOpen?" open":""}`}>
            <li><a className={`nav-link${activeSection==='about'?' active':''}`}        href="#about"        onClick={closeMenu}>About</a></li>
            <li><a className={`nav-link${activeSection==='skills'?' active':''}`}       href="#skills"       onClick={closeMenu}>Skills</a></li>
            <li><a className={`nav-link${activeSection==='projects'?' active':''}`}     href="#projects"     onClick={closeMenu}>Work</a></li>
            <li><a className={`nav-link${activeSection==='achievements'?' active':''}`} href="#achievements" onClick={closeMenu}>Achievements</a></li>
            <li><a className={`nav-link${activeSection==='contact'?' active':''}`}      href="#contact"      onClick={closeMenu}>Contact</a></li>
          </ul>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════
          HERO — FULL BLEED MAGAZINE COVER
          ══════════════════════════════════════════════ */}
      <section className="hero-section">

        {/* Floating accent shapes */}
        <div className="hero-float-shape s1"></div>
        <div className="hero-float-shape s2"></div>
        <div className="hero-float-shape s3"></div>


        {/* Full-bleed background photo with blend overlays */}
        <div className="hero-photo-bg">
          <img ref={heroBgRef} src="/hero.jpg" alt="" className="hero-photo-img" aria-hidden="true"/>
          <div className="hero-photo-blend"></div>
        </div>

        {/* Middle content row */}
        <div className="hero-mid-row">
          <div className="container">
            <div className="hero-mid-grid">

              {/* Left — name + role */}
              <div className="hero-story-left">
                <p className="hero-kicker">Full Stack Developer</p>
                <h2 className="hero-story-head">
                  ASHWIN<span className="hero-gold">KUMAR</span>
                </h2>
                <div className="hero-thin-rule"></div>
                <p className="hero-standfirst">
                  B.Tech &mdash; Information Technology<br/>
                  Vel Tech Multi Tech, Chennai<br/>
                  Building tomorrow's digital world.
                </p>
                <div className="hero-cta-row" style={{ marginTop: '28px' }}>
                  <a href="#projects" className="btn btn-primary mag-btn" onMouseMove={handleMagMove} onMouseLeave={handleMagLeave}>
                    View Work
                  </a>
                  <a href="/resume.jpg" className="btn btn-outline mag-btn" onClick={handleDownloadCV} onMouseMove={handleMagMove} onMouseLeave={handleMagLeave}>
                    <i className="fas fa-download"></i> CV
                  </a>
                </div>
              </div>

              {/* Right teasers */}
              <div className="hero-stories-right">
                <div className="hero-teaser">
                  <h3 className="hero-teaser-title">FUTURE<br/>FOCUSED</h3>
                  <div className="hero-thin-rule short"></div>
                  <p className="hero-teaser-body">How technology and purpose are shaping the leaders of <em>tomorrow.</em></p>
                </div>
                <div className="hero-teaser-divider"></div>
                <div className="hero-teaser">
                  <h3 className="hero-teaser-title">BEYOND<br/>THE CODE</h3>
                  <div className="hero-thin-rule short"></div>
                  <p className="hero-teaser-body">Passion. Discipline. Consistency. That's the real algorithm.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom: typewriter + CTA */}
        <div className="hero-bottom-row">
          <div className="container">
            <p className="hero-name-sub">Turning ideas into digital solutions that matter.</p>
            <p className="hero-typewriter-line" style={{ marginBottom: '12px' }}>
              <span className="hero-typewriter">{typewriterText}</span>
            </p>
            <div className="hero-footer-line">
              <span className="hero-plus">+</span>
              <p className="hero-footer-quote">
                YOUNG. FOCUSED. FEARLESS. &nbsp;<span>THE NEW GENERATION IS ALREADY BUILDING.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="hero-scroll-hint">
          <span>Scroll</span>
          <div className="hero-scroll-arrow"></div>
        </div>

      </section>

      {/* thin gold rule separator */}
      <div className="page-separator"></div>

      {/* ═══ ABOUT ═══ */}
      <section id="about" className="section">
        <div className="container">
          <div className="section-header stl-up stl-d1">
            <span className="section-label">Who I Am</span>
            <h2>About Me</h2>
            <div className="divider"></div>
          </div>
          <div className="about-grid">
            {[
              {title:"Profession / Studies",   body:"Currently pursuing B.Tech in Information Technology at Vel Tech Multi Tech Dr. Rangarajan Dr. Sakunthala Engineering College, building a strong foundation in software development, data structures, algorithms, databases, networking, and modern web technologies."},
              {title:"Skills / Strengths",     body:"I enjoy crafting responsive, user-friendly applications. My toolbox includes HTML5, CSS3, JavaScript, React.js, and modern frameworks. Continuous learning and best practices guide my workflow."},
              {title:"Interests / Hobbies",    body:"Beyond tech, I explore UI/UX trends, listen to music, enjoy nature walks, and spend time with friends and family."},
              {title:"Goals / Ambitions",      body:"I aim to become a versatile full-stack developer, delivering impactful digital products, solving real-world problems, and collaborating effectively."},
            ].map((card,i)=>(
              <div key={card.title} className={`glass-card about-card scroll-tilt-wrap stl-up stl-d${i+2}`}>
                <h4>{card.title}</h4>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="page-separator"></div>

      {/* ═══ SKILLS ═══ */}
      <section id="skills" className="section">
        <div className="container">
          <div className="section-header stl-up stl-d1">
            <span className="section-label">What I Use</span>
            <h2>Technical Expertise</h2>
            <div className="divider"></div>
          </div>
          <div className="skills-grid">
            {skills.map((s,i)=>(
              <div key={s.name} className={`glass-card skill-card stl-scale stl-d${i+1}`}>
                <img src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${s.icon}`} alt={s.name} className="skill-logo"/>
                <h5>{s.name}</h5>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="stats-section" ref={statsRef}>
        <div className="stats-bar stl-up">
          {[
            {num:counters.projects,     label:"Projects Completed"},
            {num:counters.technologies, label:"Technologies"},
            {num:counters.contributions,label:"GitHub Contributions"},
            {num:counters.experience,   label:"Years Coding"},
          ].map((s,i)=>(
            <div key={s.label} className="stat-item">
              <div className="stat-num-wrap">
                <span className="stat-num">{s.num}</span>
                <span className="stat-plus">+</span>
              </div>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="page-separator"></div>

      {/* ═══ GITHUB ANALYTICS ═══ */}
      <section className="section github-section">
        <div className="container">
          <div className="section-header stl-up stl-d1">
            <span className="section-label">Open Source</span>
            <h2>GitHub Analytics</h2>
            <div className="divider"></div>
          </div>

          <div className="git-metrics-grid">
            {[
              {icon:"fas fa-code-branch",value:gitStats.projects,     label:"Repositories"},
              {icon:"fas fa-history",    value:gitStats.contributions, label:"Total Commits"},
              {icon:"fas fa-users",      value:gitStats.followers,     label:"Followers"},
              {icon:"fas fa-star",       value:gitStats.stars,         label:"Stars Earned"},
            ].map((m,i)=>(
              <div key={m.label} className={`glass-card git-metric-card stl-flip stl-d${i+1}`}>
                <div className="git-metric-icon"><i className={m.icon}></i></div>
                <h3 className="git-metric-value">
                  {gitStats.isLoading?<span className="loading-spinner"></span>:m.value}
                </h3>
                <p className="git-metric-label">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-card git-heatmap-container stl-fade stl-d2">
            <h4><i className="fab fa-github" style={{marginRight:10}}></i>Contributions Calendar</h4>
            <div className="git-heatmap-scroll">
              <img src="https://ghchart.rshah.org/c9a84c/Ashwin2209" alt="GitHub Contributions" className="git-heatmap-img"/>
            </div>
          </div>

          <div className="stl-up stl-d3">
            <div className="git-repos-header">
              <h4><i className="fas fa-folder-open" style={{marginRight:10}}></i>Active Repositories</h4>
              <a href="https://github.com/Ashwin2209" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                View Profile <i className="fas fa-external-link-alt" style={{marginLeft:5}}></i>
              </a>
            </div>
            <div className="git-repos-grid">
              {gitStats.isLoading
                ?[1,2,3].map(n=>(
                  <div key={n} className="glass-card git-repo-card loading-card">
                    <div className="skeleton-line title"></div>
                    <div className="skeleton-line desc"></div>
                    <div className="skeleton-line footer-skel"></div>
                  </div>
                ))
                :gitStats.reposList.length===0
                  ?<div style={{gridColumn:"1/-1",textAlign:"center",padding:"2.5rem 0"}}>
                    <p style={{color:"var(--text-muted)"}}>No repositories found or API rate limit exceeded.</p>
                  </div>
                  :gitStats.reposList.map(repo=>(
                    <div key={repo.id} className="glass-card git-repo-card stl-up">
                      <div className="git-repo-header">
                        <h5 className="git-repo-title">{repo.name}</h5>
                        <a href={repo.html_url} target="_blank" rel="noreferrer" className="git-repo-link">
                          <i className="fab fa-github"></i>
                        </a>
                      </div>
                      <p className="git-repo-desc">{repo.description||"No description provided."}</p>
                      <div className="git-repo-footer">
                        <span className="git-repo-lang">
                          <span className="lang-dot" style={{backgroundColor:getLanguageColor(repo.language)}}></span>
                          {repo.language||"Plain Text"}
                        </span>
                        <span className="git-repo-stars">
                          <i className="fas fa-star star-icon"></i>{repo.stargazers_count}
                        </span>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </section>

      <div className="page-separator"></div>

      {/* ═══ PROJECTS ═══ */}
      <section id="projects" className="section">
        <div className="container">
          <div className="section-header stl-up stl-d1">
            <span className="section-label">Selected Work</span>
            <h2>Featured Projects</h2>
            <div className="divider"></div>
          </div>
          <div className="projects-grid">

            {[
              {delay:"stl-d2",thumb:"/thumb-portfolio.jpg",alt:"My World portfolio",title:"My World",
               liveUrl:"https://tinyurl.com/my-w0rld",codeUrl:"https://github.com/Ashwin2209/MY_Portfolio",
               tags:["React.js","Vite","Canvas"]},
              {delay:"stl-d3",thumb:"/thumb-foodie.jpg",alt:"Foodie Spot",title:"Foodie Spot",
               liveUrl:"https://foodiespot-menu.vercel.app",codeUrl:"https://github.com/Ashwin2209/Food-menu",
               tags:["React.js","JavaScript","CSS"]},
              {delay:"stl-d4",thumb:"/thumb-resume.jpg",alt:"ResumeForge",title:"ResumeForge",
               liveUrl:"https://tinyurl.com/resume2ak",codeUrl:"https://github.com/Ashwin2209/Resume",
               tags:["React.js","AI/ATS","Vite"]},
              {delay:"stl-d5",thumb:"/thumb-funcbox.jpg",alt:"FuncBox",title:"FuncBox",
               liveUrl:"https://funcbox-web.vercel.app",codeUrl:"https://github.com/funcBox-i3/funcBox-web",
               tags:["React.js","Vite","Python","Java"]},
            ].map(p=>(
              <div key={p.title} className={`project-card stl-up ${p.delay}`}>
                <div className="project-thumb-wrap">
                  <img src={p.thumb} alt={p.alt} className="project-thumb"/>
                  <div className="project-thumb-overlay">
                    <a href="#" onClick={e=>handleProjectClick(e,p.liveUrl)} className="thumb-btn">
                      Live Demo <i className="fas fa-external-link-alt"></i>
                    </a>
                    <a href="#" onClick={e=>handleProjectClick(e,p.codeUrl)} className="thumb-btn thumb-btn-sec">
                      Code <i className="fas fa-arrow-right"></i>
                    </a>
                  </div>
                </div>
                <div className="project-card-body">
                  <h4>{p.title}</h4>
                  <div className="project-tags">
                    {p.tags.map(t=><span key={t} className="tech-tag">{t}</span>)}
                  </div>
                </div>
              </div>
            ))}

            {/* FixMyCity */}
            <div className="project-card stl-up stl-d6">
              <div className="project-thumb-wrap project-no-thumb">
                <div className="project-no-thumb-inner">
                  <i className="fas fa-city project-no-thumb-icon"></i>
                  <p>Automated grievance system that generates formal letters and handles email dispatching.</p>
                </div>
                <div className="project-thumb-overlay">
                  <a href="#" onClick={e=>handleProjectClick(e,"https://github.com/Ashwin2209/FixMyCity")} className="thumb-btn">
                    View Code <i className="fas fa-arrow-right"></i>
                  </a>
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
      </section>

      <div className="page-separator"></div>

      {/* ═══ ACHIEVEMENTS ═══ */}
      <section id="achievements" className="section">
        <div className="container">
          <div className="section-header stl-up stl-d1">
            <span className="section-label">Recognition</span>
            <h2>Achievements &amp; Certifications</h2>
            <div className="divider"></div>
          </div>
          <div className="achievements-grid">
            {certs.map((cert,i)=>(
              <div
                key={cert.id}
                className={`glass-card achievement-card ${i%2===0?"stl-left":"stl-right"} stl-d${(i%3)+2}`}
                onClick={()=>setActiveCert(cert)}
              >
                <div className="achievement-icon-wrap">
                  <i className={cert.icon}></i>
                </div>
                <h4>{cert.title}</h4>
                <p className="achievement-org">{cert.org}</p>
                <p className="achievement-desc">{cert.description}</p>
                <div className="achievement-footer">
                  <span className="achievement-date">
                    <i className="far fa-calendar-alt" style={{marginRight:7}}></i>{cert.date}
                  </span>
                  <span className="achievement-view-btn">
                    View <i className="fas fa-arrow-right" style={{marginLeft:5}}></i>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="page-separator"></div>

      {/* ═══ CONTACT ═══ */}
      <section id="contact" className="section">
        <div className="container">
          <div className="contact-wrap stl-up stl-d1">
            <div className="glass-card contact-card">
              <span className="section-label">Get In Touch</span>
              <h2 style={{marginTop:12}}>Let's Work Together</h2>
              <p>Available for freelance projects and full-time opportunities.</p>
              <a href="mailto:aahwinramalakshmi@gmail.com" className="btn btn-primary btn-lg mag-btn"
                onMouseMove={handleMagMove} onMouseLeave={handleMagLeave}>
                <i className="fas fa-envelope"></i> Get In Touch
              </a>
              <div className="social-links">
                <a href="https://github.com/"         target="_blank" rel="noreferrer" className="social-link"><i className="fab fa-github"></i></a>
                <a href="https://www.linkedin.com/"   target="_blank" rel="noreferrer" className="social-link"><i className="fab fa-linkedin"></i></a>
                <a href="https://www.instagram.com/"  target="_blank" rel="noreferrer" className="social-link"><i className="fab fa-instagram"></i></a>
                <a href="https://x.com/home"          target="_blank" rel="noreferrer" className="social-link"><i className="fab fa-twitter"></i></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="container">
          <small>&copy; 2025 Ashwinkumar. Built with Professionalism &amp; React.</small>
        </div>
      </footer>
    </>
  );
}

export default App;
