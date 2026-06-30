/* ============================================
   Ajay Kumar — Portfolio interactions
   1. Three.js floating particle background
   2. Scroll reveal for sections
   3. Mouse tilt effect on cards
   ============================================ */

/* ---------- 1. Three.js background ---------- */

(function initBackground() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Group of floating wireframe shapes
  const group = new THREE.Group();
  const geometries = [
    new THREE.IcosahedronGeometry(1.4, 0),
    new THREE.OctahedronGeometry(1.2, 0),
    new THREE.TetrahedronGeometry(1.3, 0),
  ];

  const accent = new THREE.Color(0x7ee787);
  const accent2 = new THREE.Color(0xbc8cff);

  const shapes = [];
  const SHAPE_COUNT = 28;

  for (let i = 0; i < SHAPE_COUNT; i++) {
    const geo = geometries[i % geometries.length];
    const color = i % 3 === 0 ? accent2 : accent;
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.set(
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 40
    );
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      0
    );

    const scale = 0.5 + Math.random() * 1.2;
    mesh.scale.set(scale, scale, scale);

    mesh.userData.rotSpeedX = (Math.random() - 0.5) * 0.003;
    mesh.userData.rotSpeedY = (Math.random() - 0.5) * 0.003;
    mesh.userData.driftSpeed = 0.1 + Math.random() * 0.2;
    mesh.userData.driftOffset = Math.random() * Math.PI * 2;

    group.add(mesh);
    shapes.push(mesh);
  }

  scene.add(group);

  // Subtle parallax based on pointer position
  let pointerX = 0;
  let pointerY = 0;

  window.addEventListener("pointermove", (e) => {
    pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    if (!prefersReducedMotion) {
      const t = clock.getElapsedTime();

      shapes.forEach((mesh) => {
        mesh.rotation.x += mesh.userData.rotSpeedX;
        mesh.rotation.y += mesh.userData.rotSpeedY;
        mesh.position.y +=
          Math.sin(t * mesh.userData.driftSpeed + mesh.userData.driftOffset) *
          0.004;
      });

      // gentle camera parallax toward pointer
      camera.position.x += (pointerX * 4 - camera.position.x) * 0.02;
      camera.position.y += (-pointerY * 4 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);
    }

    renderer.render(scene, camera);
  }

  animate();
})();

/* ---------- 4. Owner mode + editable skills ---------- */

(function initOwnerModeAndSkills() {
  const OWNER_KEY = "portfolioOwner";

  // Visit the site once with ?owner=true in the URL (e.g.
  // index.html?owner=true) to unlock edit controls on this browser.
  // It's remembered after that — no need to add it again.
  // To revoke access on a device, run in the browser console:
  // localStorage.removeItem('portfolioOwner')
  const params = new URLSearchParams(window.location.search);
  if (params.get("owner") === "true") {
    localStorage.setItem(OWNER_KEY, "true");
    params.delete("owner");
    const cleanUrl =
      window.location.pathname +
      (params.toString() ? "?" + params.toString() : "") +
      window.location.hash;
    history.replaceState(null, "", cleanUrl);
  }

  const isOwner = localStorage.getItem(OWNER_KEY) === "true";
  if (isOwner) {
    document.body.classList.add("owner-mode");
  }

  const skillsList = document.getElementById("skills-list");
  const addSkillBtn = document.getElementById("add-skill-btn");
  if (!skillsList) return;

  function addRemoveButton(li) {
    if (li.querySelector(".skill-remove")) return;
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "skill-remove";
    removeBtn.textContent = "✕";
    removeBtn.setAttribute("aria-label", "Remove skill");
    removeBtn.addEventListener("click", () => {
      li.remove();
      saveSkills();
    });
    li.appendChild(removeBtn);
  }

  function saveSkills() {
    const skills = Array.from(skillsList.querySelectorAll("li")).map(
      (li) => li.dataset.skill
    );
    localStorage.setItem("portfolioSkills", JSON.stringify(skills));
  }

  function addSkillLi(name) {
    const li = document.createElement("li");
    li.dataset.skill = name;
    li.textContent = name;
    addRemoveButton(li);
    skillsList.appendChild(li);
  }

  // Load any saved custom skill list (only matters once you've edited it)
  const saved = localStorage.getItem("portfolioSkills");
  if (saved) {
    try {
      const skills = JSON.parse(saved);
      skillsList.innerHTML = "";
      skills.forEach(addSkillLi);
    } catch (e) {
      /* ignore malformed storage */
    }
  } else {
    skillsList.querySelectorAll("li").forEach(addRemoveButton);
  }

  if (addSkillBtn) {
    if (isOwner) addSkillBtn.hidden = false;
    addSkillBtn.addEventListener("click", () => {
      const name = prompt("Skill name:");
      if (name && name.trim()) {
        addSkillLi(name.trim());
        saveSkills();
      }
    });
  }

  // ----- Projects -----
  const projectsList = document.getElementById("projects-list");
  const addProjectBtn = document.getElementById("add-project-btn");

  if (projectsList) {
    function addProjectRemoveButton(item) {
      if (item.querySelector(".project-remove")) return;
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "project-remove";
      removeBtn.textContent = "✕";
      removeBtn.setAttribute("aria-label", "Remove project");
      removeBtn.addEventListener("click", () => {
        item.remove();
        saveProjects();
      });
      item.appendChild(removeBtn);
    }

    function saveProjects() {
      const projects = Array.from(
        projectsList.querySelectorAll(".project-item")
      ).map((item) => ({
        name: item.dataset.name,
        url: item.dataset.url,
      }));
      localStorage.setItem("portfolioProjects", JSON.stringify(projects));
    }

    function addProjectItem(name, url) {
      const item = document.createElement("div");
      item.className = "project-item";
      item.dataset.name = name;
      item.dataset.url = url;

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = name;
      item.appendChild(link);

      addProjectRemoveButton(item);
      projectsList.appendChild(item);
    }

    const savedProjects = localStorage.getItem("portfolioProjects");
    if (savedProjects) {
      try {
        const projects = JSON.parse(savedProjects);
        projectsList.innerHTML = "";
        projects.forEach((p) => addProjectItem(p.name, p.url));
      } catch (e) {
        /* ignore malformed storage */
      }
    } else {
      projectsList
        .querySelectorAll(".project-item")
        .forEach(addProjectRemoveButton);
    }

    if (addProjectBtn) {
      if (isOwner) addProjectBtn.hidden = false;
      addProjectBtn.addEventListener("click", () => {
        const name = prompt("Project name:");
        if (!name || !name.trim()) return;
        const url = prompt("Project link (URL):");
        if (!url || !url.trim()) return;
        addProjectItem(name.trim(), url.trim());
        saveProjects();
      });
    }
  }
})();

/* ---------- 4. Page switching (SPA-style nav) ---------- */

(function initPageSwitching() {
  const navLinks = document.querySelectorAll(".nav-link");
  const pages = document.querySelectorAll(".page");

  function showPage(targetId) {
    pages.forEach((page) => {
      const isTarget = page.id === targetId;
      page.classList.toggle("active", isTarget);
      if (isTarget) {
        // retrigger the reveal animation each time a page is shown
        page.classList.remove("visible");
        // force reflow so the transition replays
        void page.offsetWidth;
        page.classList.add("visible");
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.target === targetId);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.dataset.target;
      showPage(targetId);
      history.replaceState(null, "", `#${targetId}`);
    });
  });

  // support direct links like portfolio.html#contact
  const initial = window.location.hash.replace("#", "") || "home";
  showPage(document.getElementById(initial) ? initial : "home");
})();


(function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
})();

/* ---------- 3. Card tilt on hover ---------- */

(function initCardTilt() {
  const cards = document.querySelectorAll("section");
  const MAX_TILT = 6; // degrees

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const percentX = x / rect.width - 0.5;
      const percentY = y / rect.height - 0.5;

      const rotateY = percentX * MAX_TILT * 2;
      const rotateX = -percentY * MAX_TILT * 2;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    });
  });
})();