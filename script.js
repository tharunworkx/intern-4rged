// ==========================================
// 4RGED TODO — SCRIPT LOGIC (CLEAN & MINIMALIST)
// ==========================================

// Ensure dynamic title
function updateBranding() {
    document.title = "4rged Todo";
}

// Auto-Construct 4rged Todo UI if missing from static HTML
function ensureEverDoLayout() {
    if (!document.querySelector(".window-container")) {
        document.body.innerHTML = `
            <div class="window-container">
                <aside class="sidebar">
                    <div class="sidebar-top">
                        <div class="sidebar-brand">
                            <div class="brand-icon-box">
                                <i class="fa-solid fa-layer-group"></i>
                            </div>
                            <div class="brand-details">
                                <span class="brand-title">4rged</span>
                                <span class="brand-subtitle">WORKSPACE</span>
                            </div>
                        </div>
                    </div>
                    <nav class="sidebar-nav">
                        <button class="nav-item filter-btn active" data-filter="all">
                            <i class="fa-solid fa-inbox"></i>
                            <span>All Tasks</span>
                        </button>
                        <button class="nav-item filter-btn" data-filter="active">
                            <i class="fa-regular fa-circle-dot"></i>
                            <span>Active</span>
                        </button>
                        <button class="nav-item filter-btn" data-filter="completed">
                            <i class="fa-solid fa-circle-check"></i>
                            <span>Completed</span>
                        </button>
                    </nav>
                    <div class="sidebar-bottom">
                        <button id="quick-add-btn" class="floating-add-btn" title="Add New Task">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </aside>
                <main class="main-content">
                    <header class="content-header">
                        <div class="header-titles">
                            <span class="sub-badge">4rged — MVP</span>
                            <h1 class="main-title">4rged Todo</h1>
                        </div>
                        <div id="filter-container" class="top-filter-pills">
                            <button class="filter-btn active" data-filter="all">All</button>
                            <button class="filter-btn" data-filter="active">Active</button>
                            <button class="filter-btn" data-filter="completed">Completed</button>
                        </div>
                    </header>
                    <div id="input-container">
                        <section id="inner_cont">
                            <div class="input-field-box">
                                <i class="fa-solid fa-pen-to-square input-icon"></i>
                                <input id="input" placeholder="Enter a new task..." autocomplete="off">
                            </div>
                            <button id="addbtn">ADD</button>
                        </section>
                    </div>
                    <div class="section-heading">
                        <h2 id="section-heading-text">Task Items</h2>
                    </div>
                    <div id="todo-container">
                        <ul id="task-list"></ul>
                    </div>
                </main>
            </div>
            <!-- Confirmation Modal on Delete -->
            <div id="delete-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-card">
                    <div class="modal-icon-wrap">
                        <i class="fa-solid fa-trash-can"></i>
                    </div>
                    <h3 id="modal-title" class="modal-title">Are you sure?</h3>
                    <p class="modal-desc">Do you really want to delete this task? This action cannot be undone.</p>
                    <div class="modal-actions">
                        <button id="cancel-delete-btn" class="modal-btn cancel-btn">Cancel</button>
                        <button id="confirm-delete-btn" class="modal-btn confirm-delete-btn">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    updateBranding();
}

// Ensure Font Awesome & Fonts are present
if (!document.querySelector("link[href*='font-awesome']")) {
    const fa = document.createElement("link");
    fa.rel = "stylesheet";
    fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
    document.head.appendChild(fa);
}

ensureEverDoLayout();

// DOM Element References
const inputbox = document.querySelector("#input");
const addbtn = document.getElementById("addbtn");
const todolist = document.querySelector("#task-list") || document.querySelector("ul");
const filterBtns = document.querySelectorAll(".filter-btn");
const quickAddBtn = document.getElementById("quick-add-btn");

// Modal Elements (Custom Confirmation Modal)
const deleteModal = document.getElementById("delete-modal");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

let editingIndex = null;
let currentFilter = "all";
let taskToDeleteIndex = null;

// Load stored todos with backward compatibility
function getStoredTodos() {
    try {
        let raw = JSON.parse(localStorage.getItem("todos")) || [];
        return raw.map(item => {
            if (typeof item === "string") {
                return { text: item, completed: false };
            }
            return {
                text: item.text || "",
                completed: Boolean(item.completed)
            };
        });
    } catch (e) {
        return [];
    }
}

let storedTodo = getStoredTodos();

function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(storedTodo));
}

// Initial standardize
saveTodos();

// Handle Add / Edit Task
function handleAddtask() {
    const textVal = inputbox.value.trim();
    if (textVal.length === 0) return;

    if (addbtn.innerHTML.includes("Save") && editingIndex !== null) {
        storedTodo[editingIndex].text = textVal;
        addbtn.innerHTML = "ADD";
        editingIndex = null;
    } else {
        storedTodo.push({ text: textVal, completed: false });
    }

    saveTodos();
    inputbox.value = "";
    displayTodo();
}

// Display Todos with Clearly Defined Boxes & Empty State Illustration
function displayTodo() {
    todolist.innerHTML = "";

    let visibleTasks = 0;

    storedTodo.forEach((task, index) => {
        // Filter logic: All / Active / Completed
        if (currentFilter === "active" && task.completed) return;
        if (currentFilter === "completed" && !task.completed) return;

        visibleTasks++;
        const isDone = task.completed;
        const list = document.createElement("li");
        list.setAttribute("data-index", index);
        if (isDone) {
            list.classList.add("completed");
        }

        const statusBadge = isDone 
            ? `<span class="status-badge completed-badge"><i class="fa-solid fa-check"></i> Done</span>`
            : `<span class="status-badge active-badge"><i class="fa-regular fa-circle-dot"></i> Active</span>`;

        list.innerHTML = `
            <div class="card-header-row">
                <input type="checkbox" class="task-checkbox" ${isDone ? "checked" : ""}>
                ${statusBadge}
            </div>
            <div class="task-content-wrapper">
                <p class="task">${task.text}</p>
            </div>
            <div class="btn-container">
                <button class="edit-btn"><i class="fa-solid fa-pen"></i> Edit</button>
                <button class="delete-btn"><i class="fa-regular fa-trash-can"></i> Delete</button>
            </div>
        `;
        todolist.appendChild(list);
    });

    // Feature 1: Empty State Illustration
    if (visibleTasks === 0) {
        let filterLabel = currentFilter === "active" ? "active " : (currentFilter === "completed" ? "completed " : "");
        todolist.innerHTML = `
            <li class="empty-state-card">
                <div class="empty-state-icon">
                    <i class="fa-solid fa-clipboard-check"></i>
                </div>
                <h3 class="empty-state-title">No ${filterLabel}tasks found</h3>
                <p class="empty-state-desc">You're all caught up! Add a new task above to stay productive.</p>
            </li>
        `;
    }
}

// Open Delete Confirmation Modal
function openDeleteModal(index) {
    taskToDeleteIndex = index;
    if (deleteModal) {
        deleteModal.classList.remove("hidden");
    }
}

// Close Delete Confirmation Modal
function closeDeleteModal() {
    taskToDeleteIndex = null;
    if (deleteModal) {
        deleteModal.classList.add("hidden");
    }
}

// Confirm Delete Action
function confirmDeleteTask() {
    if (taskToDeleteIndex !== null && taskToDeleteIndex >= 0 && taskToDeleteIndex < storedTodo.length) {
        storedTodo.splice(taskToDeleteIndex, 1);
        if (editingIndex === taskToDeleteIndex) {
            editingIndex = null;
            addbtn.innerHTML = "ADD";
            inputbox.value = "";
        } else if (editingIndex !== null && editingIndex > taskToDeleteIndex) {
            editingIndex--;
        }
        saveTodos();
        displayTodo();
    }
    closeDeleteModal();
}

// Event Delegation for Task Actions (Checkbox, Edit, Delete)
function handleUpdate(e) {
    const listElement = e.target.closest("li");
    if (!listElement) return;

    const index = parseInt(listElement.getAttribute("data-index"), 10);
    if (isNaN(index) || index < 0 || index >= storedTodo.length) return;

    // 1. Mark as Complete (Checkbox or Task text click)
    if (e.target.classList.contains("task-checkbox") || e.target.classList.contains("task")) {
        if (e.target.classList.contains("task")) {
            storedTodo[index].completed = !storedTodo[index].completed;
        } else {
            storedTodo[index].completed = e.target.checked;
        }
        saveTodos();
        displayTodo();
        return;
    }

    // 2. Delete Task -> Open Custom In-App Modal (NEVER browser alert)
    if (e.target.classList.contains("delete-btn") || e.target.closest(".delete-btn")) {
        openDeleteModal(index);
        return;
    }

    // 3. Edit Task
    if (e.target.classList.contains("edit-btn") || e.target.closest(".edit-btn")) {
        editingIndex = index;
        inputbox.value = storedTodo[index].text;
        addbtn.innerHTML = "Save";
        inputbox.focus();
    }
}

// Filter Tabs Sync (Sidebar & Top Pills)
filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const filterVal = btn.getAttribute("data-filter");
        currentFilter = filterVal;

        // Sync all filter buttons with matching data-filter
        document.querySelectorAll(".filter-btn").forEach(b => {
            if (b.getAttribute("data-filter") === filterVal) {
                b.classList.add("active");
            } else {
                b.classList.remove("active");
            }
        });

        displayTodo();
    });
});

// Quick Add Button in Sidebar
if (quickAddBtn) {
    quickAddBtn.addEventListener("click", () => {
        inputbox.focus();
    });
}

// Modal Action Listeners (Custom UI Confirmation Modal)
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", confirmDeleteTask);
}
if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", closeDeleteModal);
}
if (deleteModal) {
    deleteModal.addEventListener("click", (e) => {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
}

// Keyboard shortcut (Escape key closes modal)
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && deleteModal && !deleteModal.classList.contains("hidden")) {
        closeDeleteModal();
    }
});

// Event Listeners
addbtn.addEventListener("click", handleAddtask);
todolist.addEventListener("click", handleUpdate);

// Enter Key to Add/Save
inputbox.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleAddtask();
    }
});

// Initial Render
displayTodo();
updateBranding();