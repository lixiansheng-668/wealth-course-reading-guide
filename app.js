(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const topNav = document.querySelector(".top-nav");
  const lessonLinks = Array.from(document.querySelectorAll(".lesson-nav a"));
  const lessons = Array.from(document.querySelectorAll(".lesson[id]"));
  const printBtn = document.getElementById("print-dash");

  if (navToggle && topNav) {
    navToggle.addEventListener("click", function () {
      const open = topNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "关闭课节目录" : "打开课节目录");
    });

    topNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        topNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "打开课节目录");
      });
    });
  }

  function setActiveLesson() {
    if (!lessons.length || !lessonLinks.length) return;

    const offset = 120;
    let currentId = lessons[0].id;

    for (let i = 0; i < lessons.length; i++) {
      const rect = lessons[i].getBoundingClientRect();
      if (rect.top - offset <= 0) {
        currentId = lessons[i].id;
      }
    }

    lessonLinks.forEach(function (link) {
      const href = link.getAttribute("href") || "";
      const id = href.replace("#", "");
      link.classList.toggle("active", id === currentId);
    });
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        setActiveLesson();
        ticking = false;
      });
    },
    { passive: true }
  );

  setActiveLesson();

  if (printBtn) {
    printBtn.addEventListener("click", function () {
      window.print();
    });
  }
})();
