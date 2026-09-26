/* =====================================
   CYBERSHIELD CONTACT JAVASCRIPT
   Connects to Render backend via api.js
   ===================================== */

const contactForm = document.getElementById("contactForm");

if (contactForm) {

    contactForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document.getElementById("name");
        const phone = document.getElementById("phone");
        const email = document.getElementById("email");
        const organization = document.getElementById("organization");
        const service = document.getElementById("service");
        const message = document.getElementById("message");
        const consent = document.getElementById("consent");

        const nameError = document.getElementById("nameError");
        const emailError = document.getElementById("emailError");
        const serviceError = document.getElementById("serviceError");
        const messageError = document.getElementById("messageError");
        const successMessage = document.getElementById("formSuccess");

        if (nameError) nameError.textContent = "";
        if (emailError) emailError.textContent = "";
        if (serviceError) serviceError.textContent = "";
        if (messageError) messageError.textContent = "";

        if (successMessage) {
            successMessage.classList.remove("show");
            successMessage.textContent = "";
        }

        let valid = true;

        if (name.value.trim().length < 2) {
            if (nameError) nameError.textContent = "Please enter your full name.";
            valid = false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value.trim())) {
            if (emailError) emailError.textContent = "Please enter a valid email address.";
            valid = false;
        }

        if (service.value === "") {
            if (serviceError) serviceError.textContent = "Please select a service.";
            valid = false;
        }

        if (message.value.trim().length < 10) {
            if (messageError) messageError.textContent = "Please provide a little more information.";
            valid = false;
        }

        if (!consent.checked) {
            alert("Please confirm that you are not submitting passwords, private keys or other highly sensitive credentials.");
            valid = false;
        }

        if (!valid) return;

        if (successMessage) {
            successMessage.textContent = "Sending your message...";
            successMessage.classList.add("show");
        }

        try {
            const data = await API.sendContact({
                name: name.value.trim(),
                phone: phone.value.trim(),
                email: email.value.trim(),
                organization: organization.value.trim(),
                service: service.value,
                message: message.value.trim()
            });

            if (successMessage) {
                successMessage.textContent = data.message || "Your message has been received by CyberShield.";
                successMessage.classList.add("show");
            }

            console.log("Contact successfully saved.");
            console.log("Contact ID:", data.contact_id);

            contactForm.reset();

        } catch (error) {
            console.error("CyberShield API error:", error);
            if (successMessage) {
                successMessage.textContent = error.message || "Unable to connect to the CyberShield server. Please try again later.";
                successMessage.classList.add("show");
            }
        }

    });

}
