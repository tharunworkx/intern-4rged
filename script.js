// ==========================================
// 4RGED TODO — SCRIPT LOGIC (CLEAN & MINIMALIST)
// ==========================================

// Ensure dynamic title
function updateBranding() {
    document.title = "4rged Todo";
}

// Ensure Font Awesome & Fonts are present
if (!document.querySelector("link[href*='font-awesome']")) {
    const fa = document.createElement("link");
    fa.rel = "stylesheet";
    fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
    document.head.appendChild(fa);
}

// DOM Element References
const inputbox = document.querySelector("#input");
const addbtn = document.getElementById("addbtn");
const todolist = document.querySelector("#task-list") || document.querySelector("ul");
const filterBtns = document.querySelectorAll(".filter-btn");
const quickAddBtn = document.getElementById("quick-add-btn");

// Modal Elements (In-App Centered UI Confirmation Modal)
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

// Open Delete Confirmation Modal (In-App UI Format)
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

    // 2. Delete Task -> Open Custom In-App Modal (NO browser alert)
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