// DOM Elements
const inputbox = document.getElementById("input");
const categorySelect = document.getElementById("category-select");
const addbtn = document.getElementById("addbtn");
const todolist = document.getElementById("task-matrix") || document.querySelector("#todo-container ul");
const progressBar = document.getElementById("progress-bar");
const progressStats = document.getElementById("progress-stats");

let editingIndex = null;

// Load and normalize existing data from localStorage
let rawTodos = JSON.parse(localStorage.getItem("todos")) || [];
let storedTodo = rawTodos.map(item => {
    if (typeof item === "string") {
        return { text: item, category: "Personal", completed: false };
    }
    return {
        text: item.text || "",
        category: item.category || "Personal",
        completed: Boolean(item.completed)
    };
});
saveToLocalStorage();

// Save tasks to localStorage
function saveToLocalStorage() {
    localStorage.setItem("todos", JSON.stringify(storedTodo));
}

// Escape HTML helper
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// Update progress bar & stats
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

// Display all tasks
function displayTodo() {
    todolist.innerHTML = "";

    if (storedTodo.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-message";
        empty.textContent = "No tasks yet. Add one above!";
        todolist.appendChild(empty);
        updateProgress();
        return;
    }

    storedTodo.forEach((task, index) => {
        const list = document.createElement("li");
        if (task.completed) {
            list.classList.add("completed");
        }

        const categoryClass = `tag-${(task.category || "personal").toLowerCase()}`;

        list.innerHTML = `
            <div class="card-header">
                <span class="category-tag ${categoryClass}">${escapeHtml(task.category || "Personal")}</span>
                <label class="status-toggle">
                    <input type="checkbox" class="task-checkbox" data-index="${index}" ${task.completed ? "checked" : ""}>
                    <span>${task.completed ? "Done" : "Pending"}</span>
                </label>
            </div>
            <p class="task ${task.completed ? "completed-text" : ""}">${escapeHtml(task.text)}</p>
            <div class="btn-container">
                <button class="edit-btn" data-index="${index}">Edit</button>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </div>
        `;

        todolist.appendChild(list);
    });

    updateProgress();
}

// Add or save task
function handleAddtask() {
    const textValue = inputbox.value.trim();
    if (textValue.length === 0) return;

    const selectedCategory = categorySelect.value;

    if (editingIndex !== null && editingIndex >= 0 && editingIndex < storedTodo.length) {
        // Edit existing task
        storedTodo[editingIndex].text = textValue;
        storedTodo[editingIndex].category = selectedCategory;
        editingIndex = null;
        addbtn.textContent = "Add";
    } else {
        // Add new task
        storedTodo.push({
            text: textValue,
            category: selectedCategory,
            completed: false
        });
    }

    saveToLocalStorage();
    displayTodo();

    inputbox.value = "";
    categorySelect.value = "Work";
    inputbox.focus();
}

// Handle checkbox toggle, edit, and delete
function handleListAction(e) {
    // Checkbox toggle
    if (e.target.classList.contains("task-checkbox")) {
        const index = Number(e.target.dataset.index);
        if (!isNaN(index) && storedTodo[index]) {
            storedTodo[index].completed = e.target.checked;
            saveToLocalStorage();
            displayTodo();
        }
        return;
    }

    // Delete task
    if (e.target.classList.contains("delete-btn")) {
        const index = Number(e.target.dataset.index);
        if (!isNaN(index) && storedTodo[index]) {
            if (editingIndex === index) {
                editingIndex = null;
                addbtn.textContent = "Add";
                inputbox.value = "";
            } else if (editingIndex !== null && editingIndex > index) {
                editingIndex--;
            }

            storedTodo.splice(index, 1);
            saveToLocalStorage();
            displayTodo();
        }
        return;
    }

    // Edit task
    if (e.target.classList.contains("edit-btn")) {
        const index = Number(e.target.dataset.index);
        if (!isNaN(index) && storedTodo[index]) {
            editingIndex = index;
            inputbox.value = storedTodo[index].text;
            categorySelect.value = storedTodo[index].category || "Work";
            addbtn.textContent = "Save";
            inputbox.focus();
        }
        return;
    }
}

// Event Listeners
addbtn.addEventListener("click", handleAddtask);
todolist.addEventListener("click", handleListAction);

// Press Enter to add/save task
inputbox.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleAddtask();
    }
});

// Initial render
displayTodo();