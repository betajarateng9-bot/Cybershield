const API_BASE_URL = (typeof CONFIG !== 'undefined') ? CONFIG.API_BASE_URL : "https://cybershield-etkt.onrender.com";

// ==================================================
// HELPER: Fetch current user profile
// ==================================================
function fetchCurrentUser(token) {
    return fetch(`${API_BASE_URL}/me`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    }).then(response => {
        if (!response.ok) throw new Error("Could not load profile");
        return response.json();
    });
}

// ==================================================
// HELPER: Check auth and redirect if needed
// Call this on protected pages (dashboard, profile, requests, etc.)
// ==================================================
async function requireAuth() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    try {
        const data = await fetchCurrentUser(token);
        return { token, user: data };
    } catch (e) {
        // Token invalid or network error — force re-login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userRole");
        window.location.href = "login.html";
        return null;
    }
}

// ==================================================
// LOGIN
// ==================================================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const errorMessage = document.getElementById("errorMessage");

        errorMessage.textContent = "";

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                errorMessage.textContent = data.detail || "Login failed. Please try again.";
                return;
            }

            localStorage.setItem("accessToken", data.access_token);
            localStorage.setItem("userRole", data.role);

            if (data.role === "admin") {
                window.location.href = "admin-dashboard.html";
            } else {
                window.location.href = "dashboard.html";
            }

        } catch (error) {
            if (error.message === "Failed to fetch") {
                errorMessage.textContent = "Cannot connect to CyberShield server. Please check your internet connection or try again later.";
            } else {
                errorMessage.textContent = error.message || "Could not connect to the server.";
            }
        }
    });
}

// ==================================================
// REGISTRATION — now redirects to verify page
// ==================================================
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const errorMessage = document.getElementById("errorMessage");
        errorMessage.textContent = "";

        const payload = {
            full_name: document.getElementById("fullName").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            organization: document.getElementById("organization").value || null,
            industry: document.getElementById("industry").value || null,
            password: document.getElementById("password").value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                errorMessage.textContent = data.detail || "Registration failed. Please try again.";
                return;
            }

            // Store auth token
            localStorage.setItem("accessToken", data.access_token);
            localStorage.setItem("userRole", data.role);

            // Redirect to dashboard
            window.location.href = "dashboard.html";

        } catch (error) {
            if (error.message === "Failed to fetch") {
                errorMessage.textContent = "Cannot connect to CyberShield server. Please check your internet connection or try again later.";
            } else {
                errorMessage.textContent = error.message || "Could not connect to the server.";
            }
        }
    });
}

// ==================================================
// DASHBOARD PROTECTION + LOGOUT + WELCOME + RECENT ACTIVITY
// ==================================================
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "login.html";
    } else {
        // Check verification and load dashboard data
        (async function () {
            const auth = await requireAuth();
            if (!auth) return;

            const { token: validToken, user } = auth;

            // Set welcome message with user's name
            const welcomeMessage = document.getElementById("welcomeMessage");
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome back, ${user.full_name || 'Valued Customer'}!`;
            }

            // Fetch dynamic stats from the user's requests
            fetchRecentActivity(validToken);
        })();
    }

    logoutBtn.addEventListener("click", function () {
        const currentToken = localStorage.getItem("accessToken");

        fetch(`${API_BASE_URL}/logout`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${currentToken}` }
        })
        .catch(() => {})
        .finally(() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userRole");
            window.location.href = "login.html";
        });
    });
}

// ==================================================
// DASHBOARD — Recent Activity
// ==================================================
async function fetchRecentActivity(token) {
    const container = document.getElementById("recentActivity");
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/requests/my`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Could not load activity");

        const requests = await response.json();

        if (requests.length === 0) {
            container.innerHTML = `
                <div class="activity-empty">
                    <span class="activity-empty-icon">📭</span>
                    <p>No recent activity yet. Submit your first request to get started!</p>
                </div>
            `;
            return;
        }

        const recent = requests.slice(0, 5);
        container.innerHTML = recent.map(req => `
            <div class="activity-item">
                <div class="activity-icon">${getRequestIcon(req.request_type)}</div>
                <div class="activity-details">
                    <span class="activity-subject">${req.subject}</span>
                    <span class="activity-type">${req.request_type.replace("_", " ")}</span>
                </div>
                <span class="request-status ${formatStatusClass(req.status)}">${req.status}</span>
            </div>
        `).join("");

    } catch (error) {
        container.innerHTML = `<p class="error">Could not load recent activity.</p>`;
    }
}

function getRequestIcon(type) {
    const icons = {
        service: "🔧",
        security_assessment: "🔍",
        support_ticket: "🎫"
    };
    return icons[type] || "📋";
}

// ==================================================
// PASSWORD SHOW/HIDE TOGGLE
// ==================================================
const togglePassword = document.getElementById("togglePassword");

if (togglePassword) {
    togglePassword.addEventListener("click", function () {
        const passwordInput = document.getElementById("password");
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
        } else {
            passwordInput.type = "password";
            togglePassword.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        }
    });
}

// ==================================================
// PROFILE PAGE — enhanced with avatar, header, edit
// ==================================================
const profileCard = document.getElementById("profileCard");

if (profileCard) {
    (async function () {
        const auth = await requireAuth();
        if (!auth) return;

        const { user } = auth;

        // Update profile header
        const avatar = document.getElementById("profileAvatar");
        if (avatar) {
            avatar.textContent = (user.full_name || "U").charAt(0).toUpperCase();
        }

        const profileName = document.getElementById("profileName");
        if (profileName) {
            profileName.textContent = user.full_name || "Unknown";
        }

        const profileEmail = document.getElementById("profileEmail");
        if (profileEmail) {
            profileEmail.textContent = user.email || "—";
        }

        const profileBadge = document.getElementById("profileBadge");
        if (profileBadge) {
            if (user.status === "active") {
                profileBadge.textContent = "✓ Active";
                profileBadge.className = "profile-status-badge badge-active";
            } else {
                profileBadge.textContent = "Inactive";
                profileBadge.className = "profile-status-badge badge-inactive";
            }
        }

        // Render profile rows with icons
        const rows = [
            { icon: "👤", label: "Full Name", key: "full_name" },
            { icon: "📧", label: "Email", key: "email" },
            { icon: "📱", label: "Phone", key: "phone" },
            { icon: "🏢", label: "Organization", key: "organization" },
            { icon: "🏭", label: "Industry", key: "industry" },
            { icon: "📍", label: "Address", key: "address" },
            { icon: "📊", label: "Status", key: "status" }
        ];

        profileCard.innerHTML = rows.map(row => `
            <div class="profile-row" data-field="${row.key}">
                <span class="profile-label">
                    <span class="profile-label-icon">${row.icon}</span>
                    ${row.label}
                </span>
                <span class="profile-value">${user[row.key] || "—"}</span>
            </div>
        `).join("");
    })();

    // Edit Profile toggle
    const editBtn = document.getElementById("editProfileBtn");
    if (editBtn) {
        editBtn.addEventListener("click", function () {
            const rows = document.querySelectorAll(".profile-row[data-field]");
            const isEditing = this.classList.contains("editing");

            if (!isEditing) {
                // Switch to edit mode
                this.classList.add("editing");
                this.textContent = "💾 Save Changes";
                rows.forEach(row => {
                    const field = row.dataset.field;
                    const valueSpan = row.querySelector(".profile-value");
                    const currentValue = valueSpan.textContent.trim();

                    if (field === "status") return; // Don't allow editing status

                    valueSpan.outerHTML = `
                        <span class="profile-value">
                            <input type="text" class="profile-edit-input" data-field="${field}" value="${currentValue === "—" ? "" : currentValue}">
                        </span>
                    `;
                });
            } else {
                // Save changes
                const inputs = document.querySelectorAll(".profile-edit-input");
                const updates = {};
                inputs.forEach(input => {
                    updates[input.dataset.field] = input.value;
                });

                const token = localStorage.getItem("accessToken");
                fetch(`${API_BASE_URL}/me`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(updates)
                })
                .then(response => {
                    if (!response.ok) throw new Error("Update failed");
                    return response.json();
                })
                .then(() => {
                    window.location.reload();
                })
                .catch(() => {
                    alert("Could not update your profile. Please try again.");
                });
            }
        });
    }
}

// ==================================================
// REQUESTS PAGE — submit and list
// ==================================================
const requestForm = document.getElementById("requestForm");
const requestsList = document.getElementById("requestsList");

function formatStatusClass(status) {
    return "status-" + status.replace(" ", "-");
}

function loadMyRequests(token) {
    fetch(`${API_BASE_URL}/requests/my`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error("Could not load requests");
        return response.json();
    })
    .then(data => {
        if (data.length === 0) {
            requestsList.innerHTML = "<p>You haven't submitted any requests yet.</p>";
            return;
        }

        requestsList.innerHTML = data.map(req => `
            <div class="request-item">
                <div class="request-item-header">
                    <h4>${req.subject}</h4>
                    <span class="request-status ${formatStatusClass(req.status)}">${req.status}</span>
                </div>
                <span class="request-type-tag">${req.request_type.replace("_", " ")}</span>
                <p>${req.description}</p>
            </div>
        `).join("");
    })
    .catch(error => {
        requestsList.innerHTML = `<p class="error">Could not load your requests.</p>`;
    });
}

if (requestForm) {
    (async function () {
        const auth = await requireAuth();
        if (!auth) return;

        const { token } = auth;
        loadMyRequests(token);

        requestForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const requestError = document.getElementById("requestError");
            requestError.textContent = "";

            const payload = {
                request_type: document.getElementById("requestType").value,
                subject: document.getElementById("subject").value,
                description: document.getElementById("description").value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/requests`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    requestError.textContent = data.detail || "Could not submit request.";
                    return;
                }

                requestForm.reset();
                loadMyRequests(token);

            } catch (error) {
                requestError.textContent = "Could not connect to the server.";
            }
        });
    })();
}

// ==================================================
// ADMIN DASHBOARD — stats
// ==================================================
const statsGrid = document.getElementById("statsGrid");

if (statsGrid) {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "admin") {
        window.location.href = "login.html";
    } else {
        fetch(`${API_BASE_URL}/admin/stats`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error("Could not load stats");
            return response.json();
        })
        .then(data => {
            statsGrid.innerHTML = `
                <div class="stat-box stat-blue">
                    <div class="stat-icon">👥</div>
                    <h2>${data.total_customers}</h2>
                    <p>Total Customers</p>
                </div>
                <div class="stat-box stat-green">
                    <div class="stat-icon">📞</div>
                    <h2>${data.total_contacts}</h2>
                    <p>Total Contacts</p>
                </div>
                <div class="stat-box stat-orange">
                    <div class="stat-icon">⏳</div>
                    <h2>${data.pending_requests}</h2>
                    <p>Pending Requests</p>
                </div>
                <div class="stat-box stat-purple">
                    <div class="stat-icon">🔄</div>
                    <h2>${data.active_requests}</h2>
                    <p>Active Cases</p>
                </div>
                <div class="stat-box stat-teal">
                    <div class="stat-icon">✅</div>
                    <h2>${data.approved_requests}</h2>
                    <p>Approved / Completed</p>
                </div>
                <div class="stat-box stat-blue">
                    <div class="stat-icon">📊</div>
                    <h2>${data.total_requests}</h2>
                    <p>Total Requests</p>
                </div>
                <div class="stat-box stat-red">
                    <div class="stat-icon">🚨</div>
                    <h2>${data.unacknowledged_alerts}</h2>
                    <p>Unacknowledged Alerts</p>
                </div>
            `;
        })
        .catch(error => {
            statsGrid.innerHTML = `<p class="error">Could not load dashboard stats.</p>`;
        });
    }
}

// ==================================================
// ADMIN — REGISTER NEW CLIENT
// Only runs if this page has registerClientForm
// ==================================================

const registerClientForm = document.getElementById("registerClientForm");

if (registerClientForm) {
    const token = requireAdminOrRedirect();
    if (token) {
        registerClientForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const errorEl = document.getElementById("registerClientError");
            const successEl = document.getElementById("registerClientSuccess");
            errorEl.textContent = "";
            successEl.textContent = "";

            const payload = {
                full_name: document.getElementById("fullName").value,
                email: document.getElementById("email").value,
                phone: document.getElementById("phone").value,
                organization: document.getElementById("organization").value || null,
                industry: document.getElementById("industry").value || null
            };

            try {
                const response = await fetch(`${API_BASE_URL}/customers`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    errorEl.textContent = data.detail || "Could not register client.";
                    return;
                }

                successEl.textContent = "Client registered successfully!";
                registerClientForm.reset();

            } catch (error) {
                if (error.message === "Failed to fetch") {
                    errorEl.textContent = "Cannot connect to CyberShield server. Please check your internet connection.";
                } else {
                    errorEl.textContent = error.message || "Could not connect to the server.";
                }
            }
        });
    }
}

// ==================================================
// ADMIN — CUSTOMER MANAGEMENT
// ==================================================
const customersTableWrapper = document.getElementById("customersTableWrapper");

function requireAdminOrRedirect() {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "admin") {
        window.location.href = "login.html";
        return null;
    }
    return token;
}

function loadCustomers(token) {
    fetch(`${API_BASE_URL}/customers`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error("Could not load customers");
        return response.json();
    })
    .then(customers => {
        if (customers.length === 0) {
            customersTableWrapper.innerHTML = "<p>No customers found.</p>";
            return;
        }

        let rows = customers.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.full_name}</td>
                <td>${c.email}</td>
                <td>${c.phone}</td>
                <td>${c.organization || "—"}</td>
                <td>${c.status}</td>
                <td>
                    <button class="table-btn btn-edit" onclick="toggleEditCustomer(${c.id})">Edit</button>
                    <button class="table-btn btn-delete" onclick="deleteCustomer(${c.id})">Delete</button>
                </td>
            </tr>
            <tr id="edit-row-${c.id}" style="display: none;" class="edit-row">
                <td colspan="7">
                    <label>Full Name</label>
                    <input type="text" id="edit-name-${c.id}" value="${c.full_name}">
                    <label>Phone</label>
                    <input type="text" id="edit-phone-${c.id}" value="${c.phone}">
                    <label>Organization</label>
                    <input type="text" id="edit-org-${c.id}" value="${c.organization || ""}">
                    <label>Status</label>
                    <select id="edit-status-${c.id}">
                        <option value="active" ${c.status === "active" ? "selected" : ""}>Active</option>
                        <option value="inactive" ${c.status === "inactive" ? "selected" : ""}>Inactive</option>
                    </select>
                    <br>
                    <button class="table-btn btn-edit" onclick="saveCustomer(${c.id})">Save</button>
                </td>
            </tr>
        `).join("");

        customersTableWrapper.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Organization</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    })
    .catch(() => {
        customersTableWrapper.innerHTML = `<p class="error">Could not load customers.</p>`;
    });
}

function toggleEditCustomer(id) {
    const row = document.getElementById(`edit-row-${id}`);
    row.style.display = row.style.display === "none" ? "table-row" : "none";
}

function saveCustomer(id) {
    const token = requireAdminOrRedirect();
    if (!token) return;

    const payload = {
        full_name: document.getElementById(`edit-name-${id}`).value,
        phone: document.getElementById(`edit-phone-${id}`).value,
        organization: document.getElementById(`edit-org-${id}`).value,
        status: document.getElementById(`edit-status-${id}`).value
    };

    fetch(`${API_BASE_URL}/customers/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) throw new Error("Update failed");
        return response.json();
    })
    .then(() => loadCustomers(token))
    .catch(() => alert("Could not update customer."));
}

function deleteCustomer(id) {
    const token = requireAdminOrRedirect();
    if (!token) return;

    if (!confirm("Are you sure you want to delete this customer? This cannot be undone.")) {
        return;
    }

    fetch(`${API_BASE_URL}/customers/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error("Delete failed");
        return response.json();
    })
    .then(() => loadCustomers(token))
    .catch(() => alert("Could not delete customer."));
}

if (customersTableWrapper) {
    const token = requireAdminOrRedirect();
    if (token) {
        loadCustomers(token);
    }
}

// ==================================================
// ADMIN — CONTACT MANAGEMENT
// ==================================================
const contactsTableWrapper = document.getElementById("contactsTableWrapper");

function loadContacts(token) {
    fetch(`${API_BASE_URL}/contacts`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error("Could not load contacts");
        return response.json();
    })
    .then(contacts => {
        if (contacts.length === 0) {
            contactsTableWrapper.innerHTML = "<p>No contact submissions found.</p>";
            return;
        }

        let rows = contacts.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.name}</td>
                <td>${c.email}</td>
                <td>${c.phone}</td>
                <td>${c.service || "—"}</td>
                <td>${c.message}</td>
                <td>
                    <select onchange="updateContactStatus(${c.id}, this.value)">
                        <option value="new" ${c.status === "new" ? "selected" : ""}>New</option>
                        <option value="in progress" ${c.status === "in progress" ? "selected" : ""}>In Progress</option>
                        <option value="resolved" ${c.status === "resolved" ? "selected" : ""}>Resolved</option>
                    </select>
                </td>
            </tr>
        `).join("");

        contactsTableWrapper.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Service</th>
                        <th>Message</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    })
    .catch(() => {
        contactsTableWrapper.innerHTML = `<p class="error">Could not load contacts.</p>`;
    });
}

function updateContactStatus(id, newStatus) {
    const token = requireAdminOrRedirect();
    if (!token) return;

    fetch(`${API_BASE_URL}/contacts/${id}/status`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
        if (!response.ok) throw new Error("Update failed");
        return response.json();
    })
    .catch(() => alert("Could not update contact status."));
}

if (contactsTableWrapper) {
    const token = requireAdminOrRedirect();
    if (token) {
        loadContacts(token);
    }
}

// ==================================================
// ADMIN — REQUEST MANAGEMENT
// ==================================================
const requestsTableWrapper = document.getElementById("requestsTableWrapper");

function statusToLabel(status) {
    const labels = {
        "open": "Pending",
        "in progress": "Active",
        "resolved": "Approved / Completed",
        "closed": "Closed"
    };
    return labels[status] || status;
}

function loadAllRequests(token) {
    fetch(`${API_BASE_URL}/requests`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error("Could not load requests");
        return response.json();
    })
    .then(requests => {
        if (requests.length === 0) {
            requestsTableWrapper.innerHTML = "<p>No requests found.</p>";
            return;
        }

        let rows = requests.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.customer_id}</td>
                <td>${r.request_type.replace("_", " ")}</td>
                <td>${r.subject}</td>
                <td>${r.description}</td>
                <td>
                    <select onchange="updateRequestStatus(${r.id}, this.value)">
                        <option value="open" ${r.status === "open" ? "selected" : ""}>Pending</option>
                        <option value="in progress" ${r.status === "in progress" ? "selected" : ""}>Active</option>
                        <option value="resolved" ${r.status === "resolved" ? "selected" : ""}>Approved / Completed</option>
                        <option value="closed" ${r.status === "closed" ? "selected" : ""}>Closed</option>
                    </select>
                </td>
            </tr>
        `).join("");

        requestsTableWrapper.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer ID</th>
                        <th>Type</th>
                        <th>Subject</th>
                        <th>Description</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    })
    .catch(() => {
        requestsTableWrapper.innerHTML = `<p class="error">Could not load requests.</p>`;
    });
}

function updateRequestStatus(id, newStatus) {
    const token = requireAdminOrRedirect();
    if (!token) return;

    fetch(`${API_BASE_URL}/requests/${id}/status`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
        if (!response.ok) throw new Error("Update failed");
        return response.json();
    })
    .catch(() => alert("Could not update request status."));
}

if (requestsTableWrapper) {
    const token = requireAdminOrRedirect();
    if (token) {
        loadAllRequests(token);
    }
}

// ==================================================
// ADMIN — USER MANAGEMENT (read-only list)
// ==================================================
const usersTableWrapper = document.getElementById("usersTableWrapper");

if (usersTableWrapper) {
    const token = requireAdminOrRedirect();

    if (token) {
        fetch(`${API_BASE_URL}/accounts`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error("Could not load users");
            return response.json();
        })
        .then(users => {
            if (users.length === 0) {
                usersTableWrapper.innerHTML = "<p>No user accounts found.</p>";
                return;
            }

            let rows = users.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.email}</td>
                    <td>${u.role}</td>
                    <td>${u.customer_id || "—"}</td>
                    <td>${u.is_active ? "Active" : "Deactivated"}</td>
                </tr>
            `).join("");

            usersTableWrapper.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Customer ID</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        })
        .catch(() => {
            usersTableWrapper.innerHTML = `<p class="error">Could not load users.</p>`;
        });
    }
}

// ==================================================
// ADMIN — ASSET INVENTORY & SCANNING
// ==================================================
const assetsTableWrapper = document.getElementById("assetsTableWrapper");
const assetForm = document.getElementById("assetForm");

function riskClass(risk) {
    return "risk-" + risk;
}

function loadAssets(token) {
    fetch(`${API_BASE_URL}/assets`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error("Could not load assets");
        return response.json();
    })
    .then(assets => {
        if (assets.length === 0) {
            assetsTableWrapper.innerHTML = "<p>No assets registered yet.</p>";
            return;
        }

        let rows = assets.map(a => `
            <tr>
                <td>${a.id}</td>
                <td>${a.customer_id}</td>
                <td>${a.name}</td>
                <td>${a.target}</td>
                <td>
                    <select onchange="updateAssetFrequency(${a.id}, this.value)">
                        <option value="disabled" ${a.scan_frequency === "disabled" ? "selected" : ""}>Disabled</option>
                        <option value="every_5_min" ${a.scan_frequency === "every_5_min" ? "selected" : ""}>Every 5 min</option>
                        <option value="daily" ${a.scan_frequency === "daily" ? "selected" : ""}>Daily</option>
                        <option value="weekly" ${a.scan_frequency === "weekly" ? "selected" : ""}>Weekly</option>
                    </select>
                </td>
                <td>
                    <button class="table-btn btn-edit" onclick="runAssetScan(${a.id})">Run Scan</button>
                    <button class="table-btn btn-edit" onclick="window.location.href='admin-scan-history.html'">History</button>
                </td>
            </tr>
            <tr id="scan-row-${a.id}" style="display: none;">
                <td colspan="6" id="scan-results-${a.id}"></td>
            </tr>
        `).join("");

        assetsTableWrapper.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer ID</th>
                        <th>Asset Name</th>
                        <th>Target</th>
                        <th>Frequency</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    })
    .catch(() => {
        assetsTableWrapper.innerHTML = `<p class="error">Could not load assets.</p>`;
    });
}

function runAssetScan(assetId) {
    const token = requireAdminOrRedirect();
    if (!token) return;

    const resultsCell = document.getElementById(`scan-results-${assetId}`);
    const resultsRow = document.getElementById(`scan-row-${assetId}`);
    resultsRow.style.display = "table-row";
    resultsCell.innerHTML = "<p>Scanning target, this may take a few seconds...</p>";

    fetch(`${API_BASE_URL}/assets/${assetId}/scan`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.detail || "Scan failed");
            });
        }
        return response.json();
    })
    .then(result => {
        if (result.findings.length === 0) {
            resultsCell.innerHTML = `<p>Scan complete — no open ports found among common services checked.</p>`;
            return;
        }

        let findingsList = result.findings.map(f => `
            <li class="${riskClass(f.risk_level)}">
                Port ${f.port} (${f.service}) — ${f.risk_level.toUpperCase()} risk: ${f.description}
            </li>
        `).join("");

        resultsCell.innerHTML = `
            <p><strong>Scan complete</strong> — ${result.open_ports_count} open port(s) found, highest risk:
                <span class="${riskClass(result.highest_risk)}">${result.highest_risk.toUpperCase()}</span>
            </p>
            <ul class="scan-findings">${findingsList}</ul>
        `;
    })
    .catch(error => {
        resultsCell.innerHTML = `<p class="error">${error.message}</p>`;
    });
}

function updateAssetFrequency(assetId, frequency) {
    const token = requireAdminOrRedirect();
    if (!token) return;

    fetch(`${API_BASE_URL}/assets/${assetId}/frequency`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ scan_frequency: frequency })
    })
    .then(response => {
        if (!response.ok) throw new Error("Could not update frequency");
        return response.json();
    })
    .catch(() => alert("Could not update scan frequency."));
}

if (assetForm) {
    const token = requireAdminOrRedirect();
    if (token) {
        loadAssets(token);
    }

    assetForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const assetError = document.getElementById("assetError");
        assetError.textContent = "";

        const payload = {
            customer_id: parseInt(document.getElementById("assetCustomerId").value),
            name: document.getElementById("assetName").value,
            target: document.getElementById("assetTarget").value
        };

        fetch(`${API_BASE_URL}/assets`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.detail || "Could not register asset");
                });
            }
            return response.json();
        })
        .then(() => {
            assetForm.reset();
            loadAssets(token);
        })
        .catch(error => {
            assetError.textContent = error.message;
        });
    });
}

// ==================================================
// ADMIN — SECURITY ALERTS
// ==================================================
const alertsTableWrapper = document.getElementById("alertsTableWrapper");

function loadAlerts(token) {
    fetch(`${API_BASE_URL}/alerts`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error("Could not load alerts");
        return response.json();
    })
    .then(alerts => {
        if (alerts.length === 0) {
            alertsTableWrapper.innerHTML = "<p>No security alerts at this time.</p>";
            return;
        }

        let rows = alerts.map(a => `
            <tr class="${a.is_acknowledged ? 'alert-acknowledged' : ''}">
                <td>${a.id}</td>
                <td>${a.message}</td>
                <td><span class="request-status status-${a.risk_level === 'high' ? 'in-progress' : 'open'}">${a.risk_level.toUpperCase()}</span></td>
                <td>${new Date(a.created_at).toLocaleString()}</td>
                <td>${a.is_acknowledged ? "Acknowledged" : "Pending"}</td>
                <td>
                    ${a.is_acknowledged
                        ? ""
                        : `<button class="table-btn btn-edit" onclick="acknowledgeAlert(${a.id})">Acknowledge</button>`
                    }
                </td>
            </tr>
        `).join("");

        alertsTableWrapper.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Message</th>
                        <th>Risk</th>
                        <th>Detected</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    })
    .catch(() => {
        alertsTableWrapper.innerHTML = `<p class="error">Could not load alerts.</p>`;
    });
}

function acknowledgeAlert(alertId) {
    const token = requireAdminOrRedirect();
    if (!token) return;

    fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error("Could not acknowledge alert");
        return response.json();
    })
    .then(() => loadAlerts(token))
    .catch(() => alert("Could not acknowledge this alert."));
}

if (alertsTableWrapper) {
    const token = requireAdminOrRedirect();
    if (token) {
        loadAlerts(token);
    }
}

// ==================================================
// ADMIN — SCAN HISTORY
// ==================================================
const loadHistoryBtn = document.getElementById("loadHistoryBtn");
const scanHistoryWrapper = document.getElementById("scanHistoryWrapper");

if (loadHistoryBtn) {
    const token = requireAdminOrRedirect();

    loadHistoryBtn.addEventListener("click", function () {
        if (!token) return;

        const assetId = document.getElementById("historyAssetId").value;
        if (!assetId) {
            scanHistoryWrapper.innerHTML = `<p class="error">Enter an Asset ID first.</p>`;
            return;
        }

        scanHistoryWrapper.innerHTML = "<p>Loading scan history...</p>";

        fetch(`${API_BASE_URL}/assets/${assetId}/scans`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error("Could not load scan history");
            return response.json();
        })
        .then(scans => {
            if (scans.length === 0) {
                scanHistoryWrapper.innerHTML = "<p>No scans have been run for this asset yet.</p>";
                return;
            }

            let scanBlocks = scans.map(scan => {
                let findingsList = scan.findings.length === 0
                    ? "<p>No open ports found.</p>"
                    : `<ul class="scan-findings">${scan.findings.map(f => `
                        <li class="${riskClass(f.risk_level)}">
                            Port ${f.port} (${f.service}) — ${f.risk_level.toUpperCase()}: ${f.description}
                        </li>
                    `).join("")}</ul>`;

                return `
                    <div class="request-item" style="max-width: 700px;">
                        <div class="request-item-header">
                            <h4>Scan #${scan.id} — ${scan.status}</h4>
                            <span class="request-status ${riskClass(scan.highest_risk)}">${scan.highest_risk.toUpperCase()}</span>
                        </div>
                        <p>Scanned: ${new Date(scan.scanned_at).toLocaleString()} — ${scan.open_ports_count} open port(s)</p>
                        ${findingsList}
                    </div>
                `;
            }).join("");

            scanHistoryWrapper.innerHTML = scanBlocks;
        })
        .catch(() => {
            scanHistoryWrapper.innerHTML = `<p class="error">Could not load scan history for that asset.</p>`;
        });
    });
}

// ==================================================
// ADMIN — AUDIT LOG
// ==================================================
const auditLogWrapper = document.getElementById("auditLogWrapper");

if (auditLogWrapper) {
    const token = requireAdminOrRedirect();

    if (token) {
        fetch(`${API_BASE_URL}/audit-logs`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error("Could not load audit log");
            return response.json();
        })
        .then(logs => {
            if (logs.length === 0) {
                auditLogWrapper.innerHTML = "<p>No actions have been logged yet.</p>";
                return;
            }

            let rows = logs.map(log => `
                <tr>
                    <td>${new Date(log.created_at).toLocaleString()}</td>
                    <td>User #${log.user_id}</td>
                    <td>${log.action.replace(/_/g, " ")}</td>
                    <td>${log.target_type ? `${log.target_type} #${log.target_id}` : "—"}</td>
                    <td>${log.details || "—"}</td>
                </tr>
            `).join("");

            auditLogWrapper.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Admin</th>
                            <th>Action</th>
                            <th>Target</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        })
        .catch(() => {
            auditLogWrapper.innerHTML = `<p class="error">Could not load the audit log.</p>`;
        });
    }
}