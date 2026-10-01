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
const categorySelect = document.getElementById("category-select");
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
const themeIcon = document.getElementById("theme-icon");
const searchInput = document.getElementById("search-input");
const progressBar = document.getElementById("progress-bar");
const progressStats = document.getElementById("progress-stats");
const filterButtons = document.querySelectorAll(".filter-btn");
const sectionHeading = document.getElementById("section-heading-text");
const taskCount = document.getElementById("task-count");
const filterEmptyState = document.getElementById("filter-empty-state");
const emptyStateIcon = document.getElementById("empty-state-icon");
const emptyStateTitle = document.getElementById("empty-state-title");
const emptyStateMessage = document.getElementById("empty-state-message");
let editingIndex = null;
let taskToAnimate = null;
let currentFilter = "all";
const currentDate = new Date();
let visibleMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
let taskToAnimate = null;
let taskFilter = "all";

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

let storedTodo = (JSON.parse(localStorage.getItem("todos")) || []).map((task) => {
    if (typeof task === "string") {
        return { text: task, category: "Personal", completed: false, dueDate: "", priority: "Medium" };
    }

    return {
        text: task.text || "",
        category: task.category || "Personal",
        completed: Boolean(task.completed),
        dueDate: task.dueDate || "",
        priority: ["High", "Medium", "Low"].includes(task.priority) ? task.priority : "Medium"
    };
});

function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(storedTodo));
}

function updateProgress() {
    const total = storedTodo.length;
    const completed = storedTodo.filter((task) => task.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressBar.style.width = `${percentage}%`;
    progressStats.textContent = `${percentage}% Completed (${completed}/${total})`;
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
        category: categorySelect.value,
        completed: editingIndex === null ? false : storedTodo[editingIndex].completed,
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
        .filter(({ task }) => [task.text, task.category, task.dueDate, task.priority]
            .some((value) => value.toLowerCase().includes(query)));

    if (visibleTasks.length === 0) {
        taskToAnimate = null;
        updateProgress();
        applyStatusFilter();
        return;
    }

    visibleTasks.forEach(({ task, index }) => {
        const row = document.createElement("tr");
        row.className = `task-row priority-${task.priority.toLowerCase()}`;
        if (task.completed) row.classList.add("is-completed");
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
        const statusLabel = document.createElement("label");
        statusLabel.className = "status-toggle";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.dataset.index = String(index);
        checkbox.checked = task.completed;
        const statusText = document.createElement("span");
        statusText.textContent = task.completed ? "Done" : "Pending";
        statusLabel.append(checkbox, statusText);
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

function handleTaskAction(event) {
    if (event.target.classList.contains("task-checkbox")) {
        const index = Number(event.target.dataset.index);
        if (storedTodo[index]) {
            storedTodo[index].completed = event.target.checked;
            saveTodos();
            displayTodo();
        }
        return;
    }

    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const index = Number(button.dataset.index);
    if (button.dataset.action === "delete") {
        const task = storedTodo[index];
        const row = button.closest("tr");
        row.classList.add("is-removing");
        row.querySelectorAll("button, input").forEach((control) => {
            control.disabled = true;
        });
        window.setTimeout(() => {
            const taskIndex = storedTodo.indexOf(task);
            if (taskIndex === -1) return;
            if (editingIndex === taskIndex) resetForm();
            else if (editingIndex !== null && editingIndex > taskIndex) editingIndex -= 1;
            storedTodo.splice(taskIndex, 1);
            saveTodos();
            displayTodo();
        }, 220);
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
    const nextModeLabel = isDark ? "Switch to light mode" : "Switch to dark mode";
    themeIcon.className = isDark ? "fa-solid fa-moon" : "fa-solid fa-sun";
    themeToggle.setAttribute("aria-label", nextModeLabel);
    themeToggle.title = nextModeLabel;
    themeToggle.setAttribute("aria-pressed", String(isDark));
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

function applyStatusFilter() {
    const query = searchInput.value.trim().toLowerCase();
    const rows = Array.from(todolist.querySelectorAll("tr.task-row"));
    let visibleCount = 0;

    rows.forEach((row) => {
        const completed = Boolean(row.querySelector(".task-checkbox")?.checked);
        const matchesFilter = currentFilter === "all"
            || (currentFilter === "completed" ? completed : !completed);
        const matchesSearch = row.textContent.toLowerCase().includes(query);
        row.hidden = !matchesFilter || !matchesSearch;
        if (!row.hidden) visibleCount += 1;
    });

    const headingByFilter = {
        all: "Task Items",
        active: "Active Tasks",
        completed: "Completed Tasks"
    };
    sectionHeading.textContent = headingByFilter[currentFilter];
    taskCount.textContent = `${visibleCount} ${visibleCount === 1 ? "task" : "tasks"}`;
    let emptyState;
    if (query) {
        emptyState = {
            icon: "fa-magnifying-glass",
            title: "No matches found",
            message: `Nothing matched \"${searchInput.value.trim()}\". Try another search.`
        };
    } else if (currentFilter === "active" && storedTodo.length > 0) {
        emptyState = {
            icon: "fa-circle-check",
            title: "All caught up",
            message: "Completed tasks are out of your active list."
        };
    } else if (currentFilter === "completed") {
        emptyState = {
            icon: "fa-clipboard-check",
            title: "Nothing completed yet",
            message: "Tasks you complete will be collected here."
        };
    } else if (currentFilter === "active") {
        emptyState = {
            icon: "fa-list-check",
            title: "No active tasks yet",
            message: "Add a task to see it here."
        };
    } else {
        emptyState = {
            icon: "fa-clipboard-list",
            title: "Your list is clear",
            message: "Add a task to get started."
        };
    }

    emptyStateIcon.className = `fa-solid ${emptyState.icon}`;
    emptyStateTitle.textContent = emptyState.title;
    emptyStateMessage.textContent = emptyState.message;
    filterEmptyState.hidden = visibleCount > 0;
}

taskForm.addEventListener("submit", handleAddTask);
todolist.addEventListener("click", handleTaskAction);
searchInput.addEventListener("input", displayTodo);
filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        filterButtons.forEach((filterButton) => {
            const isActive = filterButton.dataset.filter === currentFilter;
            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute("aria-pressed", String(isActive));
        });
        applyStatusFilter();
    });
});
new MutationObserver(applyStatusFilter).observe(todolist, { childList: true });
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
    if (event.key === "Escape" && !calendarPopover.hidden) closeCalendar(true);
});
themeToggle.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme !== "dark");
});

setTheme(localStorage.getItem("theme") === "dark");
updateDueDateLabel();
displayTodo();