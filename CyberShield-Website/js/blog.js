/* =====================================
   CYBERSHIELD BLOG JAVASCRIPT
===================================== */


/* =====================================
   CATEGORY FILTER
===================================== */

const categoryButtons =
    document.querySelectorAll(".category-btn");

const blogCards =
    document.querySelectorAll(".blog-card");


categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

        const selectedCategory =
            button.dataset.category;


        /* Remove active state */

        categoryButtons.forEach(btn => {

            btn.classList.remove("active");

        });


        /* Activate selected button */

        button.classList.add("active");


        /* Filter articles */

        blogCards.forEach(card => {

            const cardCategory =
                card.dataset.category;


            if (
                selectedCategory === "all" ||
                cardCategory === selectedCategory
            ) {

                card.classList.remove("hidden");

                card.classList.remove("filtered");

                void card.offsetWidth;

                card.classList.add("filtered");

            }

            else {

                card.classList.add("hidden");

            }

        });

    });

});



/* =====================================
   FEATURED ARTICLE SCROLL
===================================== */

const featuredLink =
    document.querySelector(
        '.read-more[href="#articles"]'
    );


if (featuredLink) {

    featuredLink.addEventListener(
        "click",
        function(event) {

            const articles =
                document.querySelector("#articles");


            if (articles) {

                event.preventDefault();

                articles.scrollIntoView({

                    behavior:"smooth"

                });

            }

        }
    );

}