/* =====================================
   CYBERSHIELD API SERVICE
   Connects frontend (Netlify) to backend (Render)
   ===================================== */

const API_BASE_URL = (typeof CONFIG !== 'undefined') ? CONFIG.API_BASE_URL : "https://cybershield-api.onrender.com";

/* =====================================
   API HELPER FUNCTIONS
   ===================================== */

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem("cybershield_token");

    const defaultHeaders = {
        "Content-Type": "application/json",
    };

    if (token) {
        defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            localStorage.removeItem("cybershield_token");
            localStorage.removeItem("cybershield_role");
            throw new Error("Session expired. Please log in again.");
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Request failed");
        }

        return data;
    } catch (error) {
        if (error.name === "TypeError" && error.message === "Failed to fetch") {
            throw new Error("Cannot connect to server. Please check your connection.");
        }
        throw error;
    }
}

/* =====================================
   PUBLIC API FUNCTIONS
   ===================================== */

const API = {

    /* ---- Contact Form ---- */
    sendContact: (contactData) => {
        return apiRequest("/contact", {
            method: "POST",
            body: JSON.stringify(contactData),
        });
    },

    /* ---- Authentication ---- */
    login: (email, password) => {
        return apiRequest("/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
    },

    register: (userData) => {
        return apiRequest("/register", {
            method: "POST",
            body: JSON.stringify(userData),
        });
    },

    logout: () => {
        return apiRequest("/logout", {
            method: "POST",
        });
    },

    /* ---- Customer Profile ---- */
    getMyProfile: () => {
        return apiRequest("/me");
    },

    /* ---- Service Requests ---- */
    createServiceRequest: (requestData) => {
        return apiRequest("/requests", {
            method: "POST",
            body: JSON.stringify(requestData),
        });
    },

    getMyRequests: () => {
        return apiRequest("/requests/my");
    },

    /* ---- Admin: Dashboard Stats ---- */
    getAdminStats: () => {
        return apiRequest("/admin/stats");
    },

    /* ---- Admin: Customers ---- */
    getCustomers: () => {
        return apiRequest("/customers");
    },

    createCustomer: (customerData) => {
        return apiRequest("/customers", {
            method: "POST",
            body: JSON.stringify(customerData),
        });
    },

    updateCustomer: (customerId, updates) => {
        return apiRequest(`/customers/${customerId}`, {
            method: "PUT",
            body: JSON.stringify(updates),
        });
    },

    deleteCustomer: (customerId) => {
        return apiRequest(`/customers/${customerId}`, {
            method: "DELETE",
        });
    },

    /* ---- Admin: Service Requests ---- */
    getAllRequests: () => {
        return apiRequest("/requests");
    },

    updateRequestStatus: (requestId, status) => {
        return apiRequest(`/requests/${requestId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        });
    },

    /* ---- Admin: Assets & Scanning ---- */
    getAssets: () => {
        return apiRequest("/assets");
    },

    createAsset: (assetData) => {
        return apiRequest("/assets", {
            method: "POST",
            body: JSON.stringify(assetData),
        });
    },

    runScan: (assetId) => {
        return apiRequest(`/assets/${assetId}/scan`, {
            method: "POST",
        });
    },

    getAssetScans: (assetId) => {
        return apiRequest(`/assets/${assetId}/scans`);
    },

    updateScanFrequency: (assetId, frequency) => {
        return apiRequest(`/assets/${assetId}/frequency`, {
            method: "PUT",
            body: JSON.stringify({ scan_frequency: frequency }),
        });
    },

    /* ---- Admin: Security Alerts ---- */
    getAlerts: () => {
        return apiRequest("/alerts");
    },

    acknowledgeAlert: (alertId) => {
        return apiRequest(`/alerts/${alertId}/acknowledge`, {
            method: "PUT",
        });
    },

    /* ---- Admin: Audit Logs ---- */
    getAuditLogs: () => {
        return apiRequest("/audit-logs");
    },

    /* ---- Admin: Contacts ---- */
    getContacts: () => {
        return apiRequest("/contacts");
    },

    updateContactStatus: (contactId, status) => {
        return apiRequest(`/contacts/${contactId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        });
    },

    /* ---- Health Check ---- */
    healthCheck: () => {
        return apiRequest("/health");
    },
};
