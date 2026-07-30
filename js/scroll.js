/*==================================================
    SEEKER OF SOUNDZ v2
    SCROLL ENGINE
==================================================*/

(() => {

    const scrollTopButton =
        document.getElementById("scrollTopBtn");

    const revealElements =
        document.querySelectorAll(
            ".reveal, .reveal-left, .reveal-right"
        );

    const progressBar =
        document.createElement("div");

    progressBar.id = "scrollProgress";

    document.body.appendChild(progressBar);

    /*==============================================
        SCROLL PROGRESS
    ==============================================*/

    function updateScrollProgress() {

        const scrollTop =
            window.scrollY;

        const documentHeight =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const progress =
            documentHeight > 0
                ? scrollTop / documentHeight
                : 0;

        progressBar.style.transform =
            `scaleX(${progress})`;

        if (scrollTopButton) {
            scrollTopButton.style.setProperty("--scroll-progress", `${Math.max(0, Math.min(1, progress)) * 360}deg`);
            scrollTopButton.classList.toggle("atBottom", progress >= .985);
        }

    }

    /*==============================================
        SCROLL TO TOP BUTTON
    ==============================================*/

    function updateScrollTopButton() {

        if (!scrollTopButton) {
            return;
        }

        scrollTopButton.classList.toggle(
            "visible",
            window.scrollY > 500
        );

    }

    if (scrollTopButton) {

        scrollTopButton.addEventListener(
            "click",
            () => {

                scrollTopButton.classList.add(
                    "clicked"
                );

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                setTimeout(() => {

                    scrollTopButton.classList.remove(
                        "clicked"
                    );

                }, 650);

            }
        );

    }

    /*==============================================
        REVEAL OBSERVER
    ==============================================*/

    const revealObserver =
        new IntersectionObserver(
            (entries, observer) => {

                entries.forEach((entry) => {

                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add(
                        "visible"
                    );

                    observer.unobserve(
                        entry.target
                    );

                });

            },
            {
                threshold: 0.15,
                rootMargin:
                    "0px 0px -70px 0px"
            }
        );

    revealElements.forEach((element) => {

        revealObserver.observe(element);

    });

    /*==============================================
        SCROLL HANDLER
    ==============================================*/

    function handleScroll() {

        updateScrollProgress();

        updateScrollTopButton();

    }

    window.addEventListener(
        "scroll",
        handleScroll,
        { passive: true }
    );

    window.addEventListener(
        "resize",
        updateScrollProgress
    );

    handleScroll();

})();