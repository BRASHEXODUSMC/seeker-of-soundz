/*==================================================
    SEEKER OF SOUNDZ v2
    Navigation System
==================================================*/

const header = document.getElementById("siteHeader");
const menuButton = document.getElementById("menuToggle");
const navLinks = document.querySelector(".navLinks");
const navItems = document.querySelectorAll(".navLinks a");

/*==============================
Mobile Menu
==============================*/

menuButton.addEventListener("click", () => {

    navLinks.classList.toggle("active");

});

/*==============================
Sticky Navigation
==============================*/

window.addEventListener("scroll", () => {

    if(window.scrollY > 50){

        header.classList.add("scrolled");

    }else{

        header.classList.remove("scrolled");

    }

});

/*==============================
Close Menu When Link Clicked
==============================*/

navItems.forEach(link=>{

    link.addEventListener("click",()=>{

        navLinks.classList.remove("active");

    });

});

/*==============================
Escape Key
==============================*/

document.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        navLinks.classList.remove("active");

    }

});

/*==============================
Click Outside
==============================*/

document.addEventListener("click",(e)=>{

    if(
        !header.contains(e.target)
        &&
        navLinks.classList.contains("active")
    ){

        navLinks.classList.remove("active");

    }

});

/*==============================
Current Page Highlight
==============================*/

const currentPage = window.location.pathname.split("/").pop();

navItems.forEach(link=>{

    const href = link.getAttribute("href");

    if(href===currentPage){

        link.classList.add("active");

    }

});