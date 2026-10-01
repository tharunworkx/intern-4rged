const inputbox = document.getElementById("input");
const categorySelect = document.getElementById("category-select");
const addbtn = document.getElementById("addbtn");
const todolist = document.querySelector("#todo-container ul");
const searchInput = document.getElementById("search-input");
const progressBar = document.getElementById("progress-bar");
const progressStats = document.getElementById("progress-stats");

let editingIndex = null;
let taskToAnimate = null;

// Load and normalize existing data from localStorage (handles old string-only items)
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

// Helper: Escape HTML to prevent injection
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// Save todos array to localStorage
function saveToLocalStorage() {
    localStorage.setItem("todos", JSON.stringify(storedTodo));
}

// Update the visual progress bar and text statistics
function updateProgress() {
    const total = storedTodo.length;
    const completed = storedTodo.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (progressBar) {
        progressBar.style.width = percentage + "%";
    }
    if (progressStats) {
        progressStats.textContent = `${percentage}% Completed (${completed}/${total})`;
    }
}

// Render all todos
function displayTodo() {
    todolist.innerHTML = "";
    const query = searchInput.value.trim().toLowerCase();

    storedTodo.forEach((task, index) => {
        if (!task.text.toLowerCase().includes(query) && !task.category.toLowerCase().includes(query)) {
            return;
        }

        const list = document.createElement("li");
        if (task.completed) {
            list.classList.add("completed");
        }
        if (task === taskToAnimate) {
            list.classList.add("is-entering");
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

    taskToAnimate = null;
    updateProgress();
}

// Add or save task
function handleAddtask() {
    const textValue = inputbox.value.trim();
    if (textValue.length === 0) return;

    const selectedCategory = categorySelect.value;

    if (editingIndex !== null && editingIndex >= 0 && editingIndex < storedTodo.length) {
        // Update existing task
        storedTodo[editingIndex].text = textValue;
        storedTodo[editingIndex].category = selectedCategory;
        editingIndex = null;
        addbtn.textContent = "ADD";
    } else {
        // Add new task
        taskToAnimate = {
            text: textValue,
            category: selectedCategory,
            completed: false
        };
        storedTodo.push(taskToAnimate);
    }

    saveToLocalStorage();
    displayTodo();

    inputbox.value = "";
    categorySelect.value = "Work";
}

// Handle clicks inside the todo list (checkbox toggle, edit, delete)
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
            const task = storedTodo[index];
            const list = e.target.closest("li");
            list.classList.add("is-removing");
            list.querySelectorAll("button, input").forEach(control => {
                control.disabled = true;
            });

            window.setTimeout(() => {
                const taskIndex = storedTodo.indexOf(task);
                if (taskIndex === -1) return;

                if (editingIndex === taskIndex) {
                    editingIndex = null;
                    addbtn.textContent = "ADD";
                    inputbox.value = "";
                } else if (editingIndex !== null && editingIndex > taskIndex) {
                    editingIndex--;
                }

                storedTodo.splice(taskIndex, 1);
                saveToLocalStorage();
                displayTodo();
            }, 220);
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
searchInput.addEventListener("input", displayTodo);

// Support pressing Enter key in the input box
inputbox.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleAddtask();
    }
});

// Initial display on page load
displayTodo();