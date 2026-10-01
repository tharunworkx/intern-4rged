if (typeof document === "undefined") {
    console.error("This is browser code. Open index.html in a browser instead of running script.js with Node.");
    process.exit(0);
}

const inputbox = document.getElementById("task-input");
const categorySelect = document.getElementById("category-select");
const dueDateInput = document.getElementById("due-date");
const dueDateTrigger = document.getElementById("due-date-trigger");
const dueDateLabel = document.getElementById("due-date-label");
const calendarPopover = document.getElementById("calendar-popover");
const calendarMonth = document.getElementById("calendar-month");
const calendarDays = document.getElementById("calendar-days");
const calendarDateFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
});
const priorityInputs = document.querySelectorAll('input[name="priority"]');
const taskForm = document.getElementById("task-form");
const addbtn = document.getElementById("addbtn");
const todolist = document.querySelector("#todo-table tbody");
const themeToggle = document.getElementById("theme-toggle");
const searchInput = document.getElementById("search-input");
const progressBar = document.getElementById("progress-bar");
const progressStats = document.getElementById("progress-stats");
const progressTrack = document.querySelector(".progress-track");
const quickAddButton = document.getElementById("quick-add-btn");
const deleteModal = document.getElementById("delete-modal");
const cancelDeleteButton = document.getElementById("cancel-delete");
const confirmDeleteButton = document.getElementById("confirm-delete");
let editingIndex = null;
const currentDate = new Date();
let visibleMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
let taskToAnimate = null;
let taskFilter = "all";
let pendingDeleteIndex = null;

function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseISODate(value) {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function updateDueDateLabel() {
    const selectedDate = parseISODate(dueDateInput.value);
    dueDateLabel.textContent = selectedDate
        ? calendarDateFormatter.format(selectedDate)
        : "Choose a date";
    dueDateTrigger.classList.toggle("has-date", Boolean(selectedDate));
}

function renderCalendar() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const selectedDate = dueDateInput.value;
    const today = toISODate(new Date());
    const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    calendarMonth.textContent = new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric"
    }).format(visibleMonth);
    calendarDays.replaceChildren();

    for (let cell = 0; cell < cellCount; cell += 1) {
        const day = cell - firstWeekday + 1;
        if (day < 1 || day > daysInMonth) {
            const spacer = document.createElement("span");
            spacer.setAttribute("aria-hidden", "true");
            calendarDays.append(spacer);
            continue;
        }

        const date = new Date(year, month, day);
        const isoDate = toISODate(date);
        const dayButton = document.createElement("button");
        dayButton.type = "button";
        dayButton.className = "calendar-day";
        dayButton.dataset.date = isoDate;
        dayButton.textContent = String(day);
        dayButton.setAttribute("aria-label", calendarDateFormatter.format(date));
        dayButton.setAttribute("aria-pressed", String(isoDate === selectedDate));

        if (isoDate === selectedDate) dayButton.classList.add("is-selected");
        if (isoDate === today) {
            dayButton.classList.add("is-today");
            dayButton.setAttribute("aria-current", "date");
        }

        const focusDate = selectedDate || (year === new Date().getFullYear() && month === new Date().getMonth() ? today : toISODate(new Date(year, month, 1)));
        dayButton.tabIndex = isoDate === focusDate ? 0 : -1;
        calendarDays.append(dayButton);
    }
}

function closeCalendar(returnFocus = false) {
    calendarPopover.hidden = true;
    dueDateTrigger.setAttribute("aria-expanded", "false");
    if (returnFocus) dueDateTrigger.focus();
}

function changeCalendarMonth(offset) {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    renderCalendar();
}

function getSelectedPriority() {
    return document.querySelector('input[name="priority"]:checked')?.value || "Medium";
}

function setSelectedPriority(priority) {
    priorityInputs.forEach((input) => {
        input.checked = input.value === priority;
    });
}

let storedTodo = (JSON.parse(localStorage.getItem("todos")) || []).map((task) =>
    typeof task === "string"
        ? { text: task, dueDate: "", priority: "Medium", category: "Personal", completed: false }
        : {
            text: task.text,
            dueDate: task.dueDate || "",
            priority: ["High", "Medium", "Low"].includes(task.priority)
                ? task.priority
                : "Medium",
            category: ["Work", "Personal", "Urgent"].includes(task.category)
                ? task.category
                : "Personal",
            completed: Boolean(task.completed)
        }
);

function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(storedTodo));
}

function updateProgress() {
    const total = storedTodo.length;
    const completed = storedTodo.filter((task) => task.completed).length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;
    progressBar.style.width = `${percentage}%`;
    progressStats.textContent = `${percentage}% completed (${completed}/${total})`;
    progressTrack.setAttribute("aria-valuenow", String(percentage));
}

function resetForm() {
    taskForm.reset();
    updateDueDateLabel();
    closeCalendar();
    addbtn.textContent = "ADD";
    editingIndex = null;
}

function handleAddTask(event) {
    event.preventDefault();
    const task = {
        text: inputbox.value.trim(),
        dueDate: dueDateInput.value,
        priority: getSelectedPriority(),
        category: categorySelect.value,
        completed: editingIndex === null ? false : storedTodo[editingIndex].completed
    };

    if (!task.text) return;

    if (editingIndex === null) {
        taskToAnimate = task;
        storedTodo.push(task);
    } else {
        storedTodo[editingIndex] = task;
    }

    saveTodos();
    displayTodo();
    resetForm();
}

function displayTodo() {
    todolist.replaceChildren();

    const query = searchInput.value.trim().toLowerCase();
    const visibleTasks = storedTodo
        .map((task, index) => ({ task, index }))
        .filter(({ task }) => {
            const matchesQuery = `${task.text} ${task.category}`.toLowerCase().includes(query);
            const matchesView = taskFilter === "all"
                || (taskFilter === "active" && !task.completed)
                || (taskFilter === "completed" && task.completed);
            return matchesQuery && matchesView;
        });

    if (visibleTasks.length === 0) {
        const emptyRow = document.createElement("tr");
        const emptyCell = document.createElement("td");
        const emptyState = document.createElement("div");
        const emptyIcon = document.createElement("i");
        const emptyMessage = document.createElement("p");
        emptyCell.colSpan = 7;
        emptyCell.className = "empty-tasks";
        emptyState.className = "empty-state";
        emptyIcon.className = "fa-regular fa-face-smile empty-state-icon";
        emptyIcon.setAttribute("aria-hidden", "true");
        emptyMessage.textContent = query
            ? "No tasks match your search."
            : taskFilter === "all"
                ? "Your tasks will appear here."
                : `No ${taskFilter} tasks.`;
        emptyState.append(emptyIcon, emptyMessage);
        emptyCell.append(emptyState);
        emptyRow.append(emptyCell);
        todolist.append(emptyRow);
        taskToAnimate = null;
        updateProgress();
        return;
    }

    visibleTasks.forEach(({ task, index }, rowIndex) => {
        const row = document.createElement("tr");
        row.className = `task-row priority-${task.priority.toLowerCase()}`;
        if (task.completed) row.classList.add("completed");
        if (task === taskToAnimate) row.classList.add("is-entering");

        const title = document.createElement("p");
        title.className = task.completed ? "task completed-text" : "task";
        title.textContent = task.text;

        const serialCell = document.createElement("td");
        serialCell.className = "row-number";
        serialCell.textContent = String(rowIndex + 1);

        const taskCell = document.createElement("td");
        taskCell.className = "task-cell";
        taskCell.append(title);

        const categoryCell = document.createElement("td");
        categoryCell.className = "category-cell";
        const categoryBadge = document.createElement("span");
        categoryBadge.className = `category-tag tag-${task.category.toLowerCase()}`;
        categoryBadge.textContent = task.category;
        categoryCell.append(categoryBadge);

        const dueDateCell = document.createElement("td");
        dueDateCell.className = "due-date-cell";
        if (task.dueDate) {
            const dueDate = document.createElement("time");
            dueDate.dateTime = task.dueDate;
            dueDate.textContent = calendarDateFormatter.format(parseISODate(task.dueDate));
            dueDateCell.append(dueDate);
        } else {
            dueDateCell.classList.add("no-due-date");
            dueDateCell.textContent = "No due date";
        }

        const priorityCell = document.createElement("td");
        priorityCell.className = "priority-cell";

        const priorityBadge = document.createElement("span");
        priorityBadge.className = `priority-badge priority-${task.priority.toLowerCase()}`;
        priorityBadge.textContent = task.priority;
        priorityCell.append(priorityBadge);

        const statusCell = document.createElement("td");
        statusCell.className = "status-cell";
        const statusLabel = document.createElement("label");
        statusLabel.className = "status-toggle";
        const statusCheckbox = document.createElement("input");
        statusCheckbox.type = "checkbox";
        statusCheckbox.className = "task-checkbox";
        statusCheckbox.dataset.index = index;
        statusCheckbox.checked = task.completed;
        const statusText = document.createElement("span");
        statusText.textContent = task.completed ? "Done" : "Pending";
        statusLabel.append(statusCheckbox, statusText);
        statusCell.append(statusLabel);

        const buttons = document.createElement("div");
        buttons.className = "table-actions";

        const editButton = document.createElement("button");
        editButton.className = "edit-btn table-action-btn";
        editButton.type = "button";
        editButton.dataset.action = "edit";
        editButton.dataset.index = index;
        editButton.textContent = "Edit";

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn table-action-btn";
        deleteButton.type = "button";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.index = index;
        deleteButton.textContent = "Delete";

        const actionsCell = document.createElement("td");
        actionsCell.className = "actions-cell";
        buttons.append(editButton, deleteButton);
        actionsCell.append(buttons);

        row.append(serialCell, taskCell, categoryCell, dueDateCell, priorityCell, statusCell, actionsCell);
        todolist.append(row);
    });

    taskToAnimate = null;
    updateProgress();
}

function openDeleteModal(index) {
    pendingDeleteIndex = index;
    deleteModal.hidden = false;
    confirmDeleteButton.focus();
}

function closeDeleteModal() {
    pendingDeleteIndex = null;
    deleteModal.hidden = true;
}

function deleteTask(index) {
    const task = storedTodo[index];
    const row = todolist.querySelector(`button[data-action="delete"][data-index="${index}"]`)?.closest("tr");
    if (!task || !row) return;

    row.classList.add("is-removing");
    row.querySelectorAll("button, input").forEach((control) => {
        control.disabled = true;
    });
    window.setTimeout(() => {
        const taskIndex = storedTodo.indexOf(task);
        if (taskIndex === -1) return;

        if (editingIndex === taskIndex) {
            resetForm();
        } else if (editingIndex !== null && editingIndex > taskIndex) {
            editingIndex -= 1;
        }

        storedTodo.splice(taskIndex, 1);
        saveTodos();
        displayTodo();
    }, 220);
}

function handleTaskAction(event) {
    const checkbox = event.target.closest(".task-checkbox");
    if (checkbox) {
        if (event.type !== "change") return;
        const checkboxIndex = Number(checkbox.dataset.index);
        if (storedTodo[checkboxIndex]) {
            storedTodo[checkboxIndex].completed = checkbox.checked;
            saveTodos();
            displayTodo();
        }
        return;
    }

    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const index = Number(button.dataset.index);
    if (button.dataset.action === "delete") {
        openDeleteModal(index);
        return;
    }

    const task = storedTodo[index];
    editingIndex = index;
    inputbox.value = task.text;
    categorySelect.value = task.category;
    dueDateInput.value = task.dueDate;
    updateDueDateLabel();
    setSelectedPriority(task.priority);
    addbtn.textContent = "Save";
    inputbox.focus();
}

function setTheme(isDark) {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

taskForm.addEventListener("submit", handleAddTask);
todolist.addEventListener("click", handleTaskAction);
todolist.addEventListener("change", handleTaskAction);
cancelDeleteButton.addEventListener("click", closeDeleteModal);
confirmDeleteButton.addEventListener("click", () => {
    const index = pendingDeleteIndex;
    closeDeleteModal();
    if (index !== null) deleteTask(index);
});
deleteModal.addEventListener("click", (event) => {
    if (event.target === deleteModal) closeDeleteModal();
});
searchInput.addEventListener("input", displayTodo);
document.querySelectorAll(".task-view-filter").forEach((button) => {
    button.addEventListener("click", () => {
        taskFilter = button.dataset.filter;
        document.querySelectorAll(".task-view-filter").forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle("is-active", isActive);
            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute("aria-pressed", String(isActive));
        });
        displayTodo();
    });
});
quickAddButton.addEventListener("click", () => inputbox.focus());
dueDateTrigger.addEventListener("click", () => {
    if (!calendarPopover.hidden) {
        closeCalendar();
        return;
    }

    const selectedDate = parseISODate(dueDateInput.value);
    visibleMonth = selectedDate
        ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    renderCalendar();
    calendarPopover.hidden = false;
    dueDateTrigger.setAttribute("aria-expanded", "true");
});
calendarDays.addEventListener("click", (event) => {
    const dayButton = event.target.closest("button[data-date]");
    if (!dayButton) return;

    dueDateInput.value = dayButton.dataset.date;
    updateDueDateLabel();
    closeCalendar(true);
});
calendarDays.addEventListener("keydown", (event) => {
    const movement = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    const focusedDay = event.target.closest("button[data-date]");
    if (!movement || !focusedDay) return;

    event.preventDefault();
    const nextDate = parseISODate(focusedDay.dataset.date);
    nextDate.setDate(nextDate.getDate() + movement);
    if (nextDate.getMonth() !== visibleMonth.getMonth() || nextDate.getFullYear() !== visibleMonth.getFullYear()) {
        visibleMonth = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
        renderCalendar();
    }
    calendarDays.querySelector(`[data-date="${toISODate(nextDate)}"]`)?.focus();
});
document.getElementById("calendar-previous").addEventListener("click", () => changeCalendarMonth(-1));
document.getElementById("calendar-next").addEventListener("click", () => changeCalendarMonth(1));
document.getElementById("calendar-clear").addEventListener("click", () => {
    dueDateInput.value = "";
    updateDueDateLabel();
    closeCalendar(true);
});
document.getElementById("calendar-today").addEventListener("click", () => {
    dueDateInput.value = toISODate(new Date());
    updateDueDateLabel();
    closeCalendar(true);
});
document.addEventListener("click", (event) => {
    if (!event.target.closest(".due-date-field")) closeCalendar();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !deleteModal.hidden) closeDeleteModal();
    if (event.key === "Escape" && !calendarPopover.hidden) closeCalendar(true);
});
themeToggle.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme !== "dark");
});

setTheme(localStorage.getItem("theme") === "dark");
updateDueDateLabel();
displayTodo();
