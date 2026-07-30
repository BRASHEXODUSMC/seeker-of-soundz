/*==================================================
    SEEKER OF SOUNDZ v2
    SHARED APPLICATION ENGINE
==================================================*/

(() => {

    const html = document.documentElement;
    const body = document.body;

    html.classList.add("js");

    /*==============================================
        DOM READY
    ==============================================*/

    document.addEventListener("DOMContentLoaded", () => {

        body.classList.add("dom-ready");

        markCurrentPage();

        setupInteractiveElements();

    });

    /*==============================================
        FULL PAGE READY
    ==============================================*/

    window.addEventListener("load", () => {

        body.classList.add("page-ready");

    });

    /*==============================================
        CURRENT PAGE IDENTIFIER
    ==============================================*/

    function markCurrentPage() {

        let pageName =
            window.location.pathname
                .split("/")
                .pop()
                .replace(".html", "");

        if (!pageName) {
            pageName = "index";
        }

        body.dataset.page = pageName;

    }

    /*==============================================
        INTERACTIVE ELEMENT HOOKS
    ==============================================*/

    function setupInteractiveElements() {

        const interactiveElements =
            document.querySelectorAll(
                [
                    "a",
                    "button",
                    "input",
                    "textarea",
                    "select",
                    ".card",
                    "[data-interactive]"
                ].join(",")
            );

        interactiveElements.forEach((element) => {

            element.classList.add("interactive");

        });

    }

    /*==============================================
        DEVICE INFORMATION
    ==============================================*/

    const isTouchDevice =
        window.matchMedia("(pointer: coarse)").matches;

    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

    body.classList.toggle(
        "touch-device",
        isTouchDevice
    );

    body.classList.toggle(
        "reduced-motion",
        prefersReducedMotion
    );

    /*==============================================
        PAGE VISIBILITY
    ==============================================*/

    document.addEventListener(
        "visibilitychange",
        () => {

            body.classList.toggle(
                "page-hidden",
                document.hidden
            );

        }
    );

    /*==============================================
        SHARED GLOBAL OBJECT
    ==============================================*/

    window.SeekerOfSoundZ = {

        isTouchDevice,

        prefersReducedMotion,

        version: "2.0.0"

    };
/*==============================================
    FEATURED EVENT COUNTDOWN
==============================================*/

const eventDate =
    new Date("2026-10-24T20:00:00");

const daysElement =
    document.querySelector(
        "[data-countdown-days]"
    );

const hoursElement =
    document.querySelector(
        "[data-countdown-hours]"
    );

const minutesElement =
    document.querySelector(
        "[data-countdown-minutes]"
    );

function updateEventCountdown(){

    if(
        !daysElement ||
        !hoursElement ||
        !minutesElement
    ){
        return;
    }

    const difference =
        eventDate.getTime() -
        Date.now();

    if(difference <= 0){

        daysElement.textContent = "00";

        hoursElement.textContent = "00";

        minutesElement.textContent = "00";

        return;
    }

    const days =
        Math.floor(
            difference /
            (1000 * 60 * 60 * 24)
        );

    const hours =
        Math.floor(
            (
                difference /
                (1000 * 60 * 60)
            ) % 24
        );

    const minutes =
        Math.floor(
            (
                difference /
                (1000 * 60)
            ) % 60
        );

    daysElement.textContent =
        String(days).padStart(2,"0");

    hoursElement.textContent =
        String(hours).padStart(2,"0");

    minutesElement.textContent =
        String(minutes).padStart(2,"0");

}

updateEventCountdown();

setInterval(
    updateEventCountdown,
    30000
);
/*==============================================
    AUTOMATIC FOOTER YEAR
==============================================*/

const footerYear =
    document.getElementById("footerYear");

if(footerYear){

    footerYear.textContent =
        new Date().getFullYear();

}
})();