// ==========================================
// TODO APPLICATION SCRIPT
// ==========================================

// DOM Elements
const inputbox = document.getElementById("input");
const categorySelect = document.getElementById("category-select");
const addbtn = document.getElementById("addbtn");
const todolist = document.getElementById("task-matrix") || document.getElementById("task-list") || document.querySelector("#todo-container ul");
const progressBar = document.getElementById("progress-bar");
const progressStats = document.getElementById("progress-stats");
const themeSelect = document.getElementById("theme-select");

let editingIndex = null;
let currentFilter = "all";

// --- Theme Management ---
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
    if (themeSelect) {
        themeSelect.value = theme;
    }
}

const savedTheme = localStorage.getItem("app-theme") || "light";
applyTheme(savedTheme);

if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
        applyTheme(e.target.value);
    });
}

// --- Todo Storage & Management ---
function getStoredTodos() {
    try {
        let raw = JSON.parse(localStorage.getItem("todos")) || [];
        return raw.map(item => {
            if (typeof item === "string") {
                return { text: item, category: "Personal", completed: false };
            }
            return {
                text: item.text || "",
                category: item.category || "Personal",
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

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// --- Progress Bar Calculation ---
function updateProgress() {
    const total = storedTodo.length;
    const completed = storedTodo.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    if (progressStats) {
        progressStats.textContent = `${percentage}% (${completed} of ${total} completed)`;
    }
}

// --- Display Todos ---
function displayTodo() {
    if (!todolist) return;
    todolist.innerHTML = "";

    const filtered = storedTodo
        .map((task, idx) => ({ ...task, index: idx }))
        .filter(task => {
            if (currentFilter === "active") return !task.completed;
            if (currentFilter === "completed") return task.completed;
            return true;
        });

    if (filtered.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-message";
        empty.textContent = "No tasks yet. Add one above!";
        todolist.appendChild(empty);
        updateProgress();
        return;
    }

    filtered.forEach(task => {
        const list = document.createElement("li");
        if (task.completed) {
            list.classList.add("completed");
        }

        const categoryClass = `tag-${(task.category || "personal").toLowerCase()}`;

        list.innerHTML = `
            <div class="card-header">
                <span class="category-tag ${categoryClass}">${escapeHtml(task.category || "Personal")}</span>
                <label class="status-toggle">
                    <input type="checkbox" class="task-checkbox" data-index="${task.index}" ${task.completed ? "checked" : ""}>
                    <span>${task.completed ? "Done" : "Pending"}</span>
                </label>
            </div>
            <p class="task ${task.completed ? "completed-text" : ""}">${escapeHtml(task.text)}</p>
            <div class="btn-container">
                <button class="edit-btn" data-index="${task.index}">Edit</button>
                <button class="delete-btn" data-index="${task.index}">Delete</button>
            </div>
        `;

        todolist.appendChild(list);
    });

    updateProgress();
}

// --- Add / Save Task ---
function handleAddtask() {
    if (!inputbox) return;
    const textVal = inputbox.value.trim();
    if (textVal.length === 0) return;

    const catVal = categorySelect ? categorySelect.value : "Work";

    if (editingIndex !== null && editingIndex >= 0 && editingIndex < storedTodo.length) {
        storedTodo[editingIndex].text = textVal;
        if (categorySelect) storedTodo[editingIndex].category = catVal;
        editingIndex = null;
        if (addbtn) addbtn.textContent = "Add";
    } else {
        storedTodo.push({
            text: textVal,
            category: catVal,
            completed: false
        });
    }

    saveTodos();
    displayTodo();

    inputbox.value = "";
    if (categorySelect) categorySelect.value = "Work";
    inputbox.focus();
}

// --- List Event Delegation (Checkbox, Edit, Delete) ---
function handleListAction(e) {
    // Checkbox toggle
    if (e.target.classList.contains("task-checkbox")) {
        const index = Number(e.target.dataset.index);
        if (!isNaN(index) && storedTodo[index]) {
            storedTodo[index].completed = e.target.checked;
            saveTodos();
            displayTodo();
        }
        return;
    }

    // Delete
    if (e.target.classList.contains("delete-btn")) {
        const index = Number(e.target.dataset.index);
        if (!isNaN(index) && storedTodo[index]) {
            if (editingIndex === index) {
                editingIndex = null;
                if (addbtn) addbtn.textContent = "Add";
                if (inputbox) inputbox.value = "";
            } else if (editingIndex !== null && editingIndex > index) {
                editingIndex--;
            }

            storedTodo.splice(index, 1);
            saveTodos();
            displayTodo();
        }
        return;
    }

    // Edit
    if (e.target.classList.contains("edit-btn")) {
        const index = Number(e.target.dataset.index);
        if (!isNaN(index) && storedTodo[index]) {
            editingIndex = index;
            if (inputbox) inputbox.value = storedTodo[index].text;
            if (categorySelect) categorySelect.value = storedTodo[index].category || "Work";
            if (addbtn) addbtn.textContent = "Save";
            if (inputbox) inputbox.focus();
        }
        return;
    }
}

// Event Listeners
if (addbtn) addbtn.addEventListener("click", handleAddtask);
if (todolist) todolist.addEventListener("click", handleListAction);

if (inputbox) {
    inputbox.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleAddtask();
        }
    });
}

// Initial render
displayTodo();
