
console.log("CyberShield JavaScript is working!");

/* =====================================
   CYBERSHIELD WEBSITE JAVASCRIPT
===================================== */


/* =====================================
   1. MOBILE NAVIGATION
===================================== */

const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector("nav ul");

if (menuButton && navigation) {

    menuButton.addEventListener("click", () => {

        navigation.classList.toggle("active");

        menuButton.classList.toggle("active");

    });

}


/* =====================================
   2. CLOSE MOBILE MENU
===================================== */

const navLinks = document.querySelectorAll("nav ul li a");

navLinks.forEach(link => {

    link.addEventListener("click", () => {

        navigation.classList.remove("active");

        menuButton?.classList.remove("active");

    });

});


/* =====================================
   3. SMOOTH SCROLLING
===================================== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function(event) {

        const target = document.querySelector(this.getAttribute("href"));

        if (target) {

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth"
            });

        }

    });

});


/* =====================================
   4. HEADER SCROLL EFFECT
===================================== */

const header = document.querySelector("header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        header?.classList.add("scrolled");

    } else {

        header?.classList.remove("scrolled");

    }

});


/* =====================================
   5. SCROLL REVEAL ANIMATION
===================================== */

const revealElements = document.querySelectorAll(
    ".service-card, .industry-card, .testimonial-card, .blog-card, .feature"
);

const revealObserver = new IntersectionObserver(
    (entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

                revealObserver.unobserve(entry.target);

            }

        });

    },
    {
        threshold: 0.15
    }
);

revealElements.forEach(element => {

    element.classList.add("reveal");

    revealObserver.observe(element);

});


/* =====================================
   6. BACK TO TOP BUTTON
===================================== */

const backToTop = document.querySelector(".back-to-top");

if (backToTop) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 500) {

            backToTop.classList.add("show");

        } else {

            backToTop.classList.remove("show");

        }

    });

    backToTop.addEventListener("click", () => {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


/* =====================================
   7. CURRENT YEAR
===================================== */

const year = document.querySelector("#current-year");

if (year) {

    year.textContent = new Date().getFullYear();

}