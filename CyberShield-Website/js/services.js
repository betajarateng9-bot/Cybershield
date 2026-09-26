/* =====================================
   CYBERSHIELD SERVICES PAGE
===================================== */


/* =====================================
   SERVICE REVEAL ANIMATION
===================================== */

const serviceItems =
    document.querySelectorAll(".service-detail");


if ("IntersectionObserver" in window) {

    const serviceObserver =
        new IntersectionObserver(

            (entries, observer) => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );

                    }

                });

            },

            {
                threshold:0.15
            }

        );


    serviceItems.forEach(item => {

        serviceObserver.observe(item);

    });

}


/* =====================================
   SERVICE ANCHOR SCROLL
===================================== */

const exploreButton =
    document.querySelector(
        'a[href="#services-list"]'
    );


if (exploreButton) {

    exploreButton.addEventListener(
        "click",
        function(event) {

            const servicesSection =
                document.querySelector(
                    "#services-list"
                );

            if (servicesSection) {

                event.preventDefault();

                servicesSection.scrollIntoView({

                    behavior:"smooth"

                });

            }

        }
    );

}