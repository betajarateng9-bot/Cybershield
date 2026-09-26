/* =====================================
   CYBERSHIELD WEBSITE JAVASCRIPT
===================================== */


/* =====================================
   MOBILE NAVIGATION
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
   CLOSE MOBILE MENU
===================================== */

const navLinks = document.querySelectorAll("nav ul li a");

navLinks.forEach(link => {

    link.addEventListener("click", () => {

        if (navigation) {
            navigation.classList.remove("active");
        }

        if (menuButton) {
            menuButton.classList.remove("active");
        }

    });

});


/* =====================================
   HEADER SCROLL EFFECT
===================================== */

const header = document.querySelector("header");

window.addEventListener("scroll", () => {

    if (!header) return;

    if (window.scrollY > 50) {

        header.classList.add("scrolled");

    } else {

        header.classList.remove("scrolled");

    }

});


/* =====================================
   SCROLL REVEAL
===================================== */

const revealElements = document.querySelectorAll(
    ".service-card, .industry-card, .testimonial-card, .blog-card, .feature, .mission-card, .value-card, .about-highlight-card"
);


if ("IntersectionObserver" in window) {

    const revealObserver = new IntersectionObserver(
        (entries, observer) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("show");

                    observer.unobserve(entry.target);

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

}


/* =====================================
   BACK TO TOP
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

            top:0,

            behavior:"smooth"

        });

    });

}


/* =====================================
   CURRENT YEAR
===================================== */

const yearElement =
    document.querySelector("#current-year");

if (yearElement) {

    yearElement.textContent =
        new Date().getFullYear();

}