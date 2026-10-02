if (typeof document === "undefined") {
    console.error("This is browser code. Open index.html in a browser instead of running script.js with Node.");
    process.exit(0);
}

const inputbox = document.getElementById("task-input");
const taskFormError = document.getElementById("task-form-error");
const categorySelect = document.getElementById("category-select");
const categoryPicker = document.querySelector(".category-picker");
const categoryTrigger = document.getElementById("category-trigger");
const categoryValue = document.getElementById("category-value");
const categoryOptions = document.getElementById("category-options");
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
const taskNotesInput = document.getElementById("task-notes");
const addbtn = document.getElementById("addbtn");
const todolist = document.querySelector("#todo-table tbody");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const searchInput = document.getElementById("search-input");
const progressBar = document.getElementById("progress-bar");
const progressStats = document.getElementById("progress-stats");
const progressTrack = document.querySelector(".progress-track");
const taskCards = document.getElementById("task-cards");
const tableWrap = document.querySelector(".task-table-wrap");
const menuToggle = document.getElementById("menu-toggle");
const openAddTaskButton = document.getElementById("open-add-task");
const remindersToggle = document.getElementById("reminders-toggle");
const remindersPanel = document.getElementById("reminders-panel");
const reminderCount = document.getElementById("reminder-count");
const reminderList = document.getElementById("reminder-list");
const notificationPermissionButton = document.getElementById("enable-notifications");
const notificationStatus = document.getElementById("notification-status");
const reminderToast = document.getElementById("reminder-toast");
const taskFocusBar = document.getElementById("task-focus-bar");
const clearTaskFocusButton = document.getElementById("clear-task-focus");
const motivationQuote = document.getElementById("motivation-quote");
const nextMotivationButton = document.getElementById("next-motivation");
const sidebar = document.querySelector(".sidebar");
const drawerBackdrop = document.getElementById("drawer-backdrop");
const sortDrawer = document.getElementById("sort-drawer");
const sortTrigger = document.getElementById("sort-trigger");
const sortMenu = document.getElementById("sort-menu");
const viewDrawer = document.getElementById("view-drawer");
const viewTrigger = document.getElementById("view-trigger");
const viewMenu = document.getElementById("view-menu");
const deleteModal = document.getElementById("delete-modal");
const cancelDeleteButton = document.getElementById("cancel-delete");
const confirmDeleteButton = document.getElementById("confirm-delete");
const deleteModalTitle = document.getElementById("delete-modal-title");
const deleteModalMessage = document.getElementById("delete-modal-message");
const completionMarks = ["NICE!", "ALL SET", "CHECKED", "WELL DONE", "NAILED IT", "ONWARD"];
const motivationQuotes = [
    "Start where you are. One finished task changes the shape of the day.",
    "Small steps count. Keep moving the next important thing forward.",
    "Progress is built one checked box at a time.",
    "Focus on the next task, not the whole mountain.",
    "A little momentum now makes the next step easier.",
    "Done is a direction. Keep giving your attention to what matters."
];
let editingIndex = null;
const currentDate = new Date();
let visibleMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
let taskToAnimate = null;
let taskToCelebrate = null;
let taskToRestore = null;
let categoryFocusRestoreInProgress = false;
let focusedTaskId = null;
let taskFilter = "active";
let pendingDeleteIndex = null;
let pendingDeleteMode = "trash";
let motivationQuoteIndex = -1;
let sortMode = localStorage.getItem("todoSort") || "created-newest";
let viewMode = localStorage.getItem("todoView") || "table";
let reminderToastTimeout = null;

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

function setCategory(category) {
    categorySelect.value = category;
    categoryValue.textContent = category;
    categoryOptions.querySelectorAll("[role='option']").forEach((option) => {
        option.setAttribute("aria-selected", String(option.dataset.category === category));
    });
}

function openCategoryPicker(focusSelected = false) {
    categoryOptions.hidden = false;
    categoryTrigger.setAttribute("aria-expanded", "true");
    if (focusSelected) {
        categoryOptions.querySelector("[aria-selected='true']")?.focus();
    }
}

function closeCategoryPicker(returnFocus = false) {
    categoryOptions.hidden = true;
    categoryTrigger.setAttribute("aria-expanded", "false");
    if (returnFocus) {
        categoryFocusRestoreInProgress = true;
        categoryTrigger.focus();
        categoryFocusRestoreInProgress = false;
    }
}

function createTaskId() {
    return window.crypto?.randomUUID?.()
        || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

let storedTodo = (JSON.parse(localStorage.getItem("todos")) || []).map((task, index) =>
    typeof task === "string"
        ? { id: createTaskId(), text: task, notes: "", dueDate: "", priority: "Medium", category: "Personal", completed: false, completionMark: "", createdAt: Date.now() - index, deleted: false, deletedAt: null }
        : {
            id: typeof task.id === "string" ? task.id : createTaskId(),
            text: task.text,
            notes: typeof task.notes === "string" ? task.notes : "",
            dueDate: task.dueDate || "",
            priority: ["High", "Medium", "Low"].includes(task.priority)
                ? task.priority
                : "Medium",
            category: ["Work", "Personal", "Urgent"].includes(task.category)
                ? task.category
                : "Personal",
            completed: Boolean(task.completed),
            completionMark: Boolean(task.completed) && completionMarks.includes(task.completionMark)
                ? task.completionMark
                : "",
            createdAt: Number.isFinite(task.createdAt) ? task.createdAt : Date.now() - index,
            deleted: Boolean(task.deleted),
            deletedAt: Number.isFinite(task.deletedAt) ? task.deletedAt : null
        }
);

let reminderInbox = (JSON.parse(localStorage.getItem("daymarkReminderInbox")) || [])
    .filter((reminder) => reminder && typeof reminder.id === "string");

function getRandomCompletionMark() {
    return completionMarks[Math.floor(Math.random() * completionMarks.length)];
}

function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(storedTodo));
}

function saveReminderInbox() {
    localStorage.setItem("daymarkReminderInbox", JSON.stringify(reminderInbox));
}

function getReminderForTask(task, now) {
    if (task.completed || task.deleted) return null;

    if (task.dueDate) {
        const dueDate = parseISODate(task.dueDate);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const daysUntilDue = Math.round((dueDay - today) / 86400000);
        if (daysUntilDue < 0) {
            const daysOverdue = Math.abs(daysUntilDue);
            return {
                key: `overdue:${task.dueDate}`,
                message: `Overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}.`
            };
        }
        if (daysUntilDue === 0) return { key: `due-today:${task.dueDate}`, message: "Due today." };
        if (daysUntilDue === 1) return { key: `due-tomorrow:${task.dueDate}`, message: "Due tomorrow." };
        return null;
    }

    const ageDays = Math.floor((now.getTime() - task.createdAt) / 86400000);
    if (ageDays >= 7) {
        return {
            key: `undated:${task.createdAt}`,
            message: `No due date set; this task has been active for ${ageDays} days. Review its schedule.`
        };
    }
    return null;
}

function sendBrowserReminder(reminder) {
    if (typeof window.Notification !== "function" || Notification.permission !== "granted") return;
    try {
        new Notification(`Tasktide: ${reminder.taskText}`, {
            body: reminder.message,
            tag: reminder.id
        });
    } catch {
        notificationStatus.textContent = "Browser alerts are unavailable here; in-app reminders remain enabled.";
    }
}

function showReminderToast(reminder) {
    reminderToast.textContent = `${reminder.taskText}: ${reminder.message}`;
    reminderToast.hidden = false;
    window.clearTimeout(reminderToastTimeout);
    reminderToastTimeout = window.setTimeout(() => { reminderToast.hidden = true; }, 7000);
}

function showNextMotivationQuote() {
    let nextIndex = Math.floor(Math.random() * motivationQuotes.length);
    if (motivationQuotes.length > 1 && nextIndex === motivationQuoteIndex) {
        nextIndex = (nextIndex + 1) % motivationQuotes.length;
    }
    motivationQuoteIndex = nextIndex;
    motivationQuote.textContent = motivationQuotes[nextIndex];
}

function renderReminderCenter() {
    const visibleReminders = reminderInbox.filter((reminder) => !reminder.dismissed);
    reminderCount.textContent = String(visibleReminders.length);
    reminderCount.hidden = visibleReminders.length === 0;
    reminderList.replaceChildren();

    if (typeof window.Notification !== "function") {
        notificationPermissionButton.disabled = true;
        notificationStatus.textContent = "Browser alerts are unavailable; in-app reminders remain enabled.";
    } else if (Notification.permission === "granted") {
        notificationPermissionButton.disabled = true;
        notificationPermissionButton.textContent = "Browser alerts enabled";
        notificationStatus.textContent = "Tasktide will show browser alerts while this page is open.";
    } else if (Notification.permission === "denied") {
        notificationPermissionButton.disabled = true;
        notificationPermissionButton.textContent = "Browser alerts blocked";
        notificationStatus.textContent = "Allow notifications in your browser settings to enable system alerts.";
    } else {
        notificationPermissionButton.disabled = false;
        notificationPermissionButton.textContent = "Enable browser alerts";
        notificationStatus.textContent = "In-app reminders work now. Enable browser alerts for system notifications.";
    }

    if (visibleReminders.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "reminder-empty";
        emptyMessage.textContent = "Nothing needs attention right now.";
        reminderList.append(emptyMessage);
        return;
    }

    visibleReminders.forEach((reminder) => {
        const item = document.createElement("article");
        item.className = "reminder-item";
        const content = document.createElement("div");
        const taskText = document.createElement("strong");
        taskText.textContent = reminder.taskText;
        const message = document.createElement("p");
        message.textContent = reminder.message;
        content.append(taskText, message);
        const actions = document.createElement("div");
        actions.className = "reminder-actions";
        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "reminder-open";
        openButton.dataset.reminderAction = "open";
        openButton.dataset.reminderId = reminder.id;
        openButton.textContent = "View task";
        const dismissButton = document.createElement("button");
        dismissButton.type = "button";
        dismissButton.className = "reminder-dismiss";
        dismissButton.dataset.reminderAction = "dismiss";
        dismissButton.dataset.reminderId = reminder.id;
        dismissButton.setAttribute("aria-label", `Dismiss reminder for ${reminder.taskText}`);
        dismissButton.title = "Dismiss reminder";
        dismissButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
        actions.append(openButton, dismissButton);
        item.append(content, actions);
        reminderList.append(item);
    });
}

function checkReminders() {
    const now = new Date();
    let inboxChanged = false;
    let tasksChanged = false;

    storedTodo.forEach((task) => {
        const reminder = getReminderForTask(task, now);
        if (!reminder) return;
        const id = `${task.id}:${reminder.key}`;
        if (reminderInbox.some((item) => item.id === id)) return;

        const entry = {
            id,
            taskId: task.id,
            taskText: task.text,
            message: reminder.message,
            createdAt: now.getTime()
        };
        reminderInbox.unshift(entry);
        inboxChanged = true;
        tasksChanged = true;
        sendBrowserReminder(entry);
        showReminderToast(entry);
    });

    if (reminderInbox.length > 40) reminderInbox.length = 40;
    if (tasksChanged) saveTodos();
    if (inboxChanged || tasksChanged) saveReminderInbox();
    renderReminderCenter();
}

function removeTaskReminders(taskId) {
    const remainingReminders = reminderInbox.filter((reminder) => reminder.taskId !== taskId);
    if (remainingReminders.length === reminderInbox.length) return;
    reminderInbox = remainingReminders;
    saveReminderInbox();
    renderReminderCenter();
}

function updateProgress() {
    const liveTasks = storedTodo.filter((task) => !task.deleted);
    const total = liveTasks.length;
    const completed = liveTasks.filter((task) => task.completed).length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;
    progressBar.style.width = `${percentage}%`;
    progressStats.textContent = `${percentage}% completed (${completed}/${total})`;
    progressTrack.setAttribute("aria-valuenow", String(percentage));
}

function resetForm() {
    taskForm.reset();
    taskForm.hidden = true;
    setTaskFormError("");
    updateDueDateLabel();
    closeCalendar();
    setCategory(categorySelect.value);
    addbtn.textContent = "ADD";
    editingIndex = null;
}

function setTaskFormError(message) {
    taskFormError.textContent = message;
    taskFormError.hidden = !message;
    inputbox.setAttribute("aria-invalid", String(Boolean(message)));
}

function normalizeTaskName(name) {
    return name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function updateTaskFocusBar() {
    taskFocusBar.hidden = focusedTaskId === null;
}

function handleAddTask(event) {
    event.preventDefault();
    const taskText = inputbox.value.trim();
    if (!/\p{L}/u.test(taskText)) {
        setTaskFormError("Enter a task name with at least one letter.");
        inputbox.focus();
        return;
    }

    const normalizedName = normalizeTaskName(taskText);
    const duplicateTask = storedTodo.some((task, index) =>
        index !== editingIndex && normalizeTaskName(task.text) === normalizedName
    );
    if (duplicateTask) {
        setTaskFormError("A task with the same name already exists.");
        inputbox.focus();
        return;
    }
    setTaskFormError("");

    const task = {
        id: editingIndex === null ? createTaskId() : storedTodo[editingIndex].id,
        text: taskText,
        notes: taskNotesInput.value.trim(),
        dueDate: dueDateInput.value,
        priority: getSelectedPriority(),
        category: categorySelect.value,
        completed: editingIndex === null ? false : storedTodo[editingIndex].completed,
        completionMark: editingIndex === null ? "" : storedTodo[editingIndex].completionMark,
        createdAt: editingIndex === null ? Date.now() : storedTodo[editingIndex].createdAt,
        deleted: false,
        deletedAt: null
    };

    if (!task.text) return;

    if (editingIndex === null) {
        taskToAnimate = task;
        storedTodo.push(task);
    } else {
        storedTodo[editingIndex] = task;
    }

    saveTodos();
    checkReminders();
    displayTodo();
    resetForm();
}

function displayTodo() {
    let generatedCompletionMark = false;
    storedTodo.forEach((task) => {
        if (task.completed && !task.completionMark) {
            task.completionMark = getRandomCompletionMark();
            generatedCompletionMark = true;
        }
    });
    if (generatedCompletionMark) saveTodos();

    todolist.replaceChildren();
    taskCards.replaceChildren();

    const query = searchInput.value.trim().toLowerCase();
    const visibleTasks = storedTodo
        .map((task, index) => ({ task, index }))
        .filter(({ task }) => {
            const matchesQuery = `${task.text} ${task.notes} ${task.category}`.toLowerCase().includes(query);
            const matchesView = taskFilter === "deleted"
                ? task.deleted
                : !task.deleted && (taskFilter === "completed" ? task.completed : !task.completed);
            const matchesFocus = focusedTaskId === null || task.id === focusedTaskId;
            return matchesQuery && matchesView && matchesFocus;
        });
    visibleTasks.sort((left, right) => compareTasks(left.task, right.task));

    if (visibleTasks.length === 0) {
        const emptyRow = document.createElement("tr");
        const emptyCell = document.createElement("td");
        const emptyState = document.createElement("div");
        const emptyIcon = document.createElement("i");
        const emptyMessage = document.createElement("p");
        emptyCell.colSpan = 5;
        emptyCell.className = "empty-tasks";
        emptyState.className = "empty-state";
        emptyIcon.className = "fa-regular fa-face-smile empty-state-icon";
        emptyIcon.setAttribute("aria-hidden", "true");
        emptyMessage.textContent = query
            ? "No tasks match your search."
            : taskFilter === "deleted"
                ? "Trash is empty."
                : `No ${taskFilter} tasks.`;
        emptyState.append(emptyIcon, emptyMessage);
        emptyCell.append(emptyState);
        emptyRow.append(emptyCell);
        todolist.append(emptyRow);
        if (viewMode === "cards") {
            tableWrap.hidden = true;
            taskCards.hidden = false;
            taskCards.append(emptyState.cloneNode(true));
        } else {
            tableWrap.hidden = false;
            taskCards.hidden = true;
            todolist.append(emptyRow);
        }
        taskToAnimate = null;
        taskToCelebrate = null;
        taskToRestore = null;
        updateProgress();
        return;
    }

    visibleTasks.forEach(({ task, index }, rowIndex) => {
        const row = document.createElement("tr");
        row.className = `task-row priority-${task.priority.toLowerCase()}`;
        if (task.completed) row.classList.add("completed");
        if (task === taskToAnimate) row.classList.add("is-entering");
        if (task === taskToCelebrate) row.classList.add("is-completing");
        if (task === taskToRestore) row.classList.add("is-restoring");

        const title = document.createElement("p");
        title.className = task.completed ? "task completed-text" : "task";
        title.textContent = task.text;
        if (task.completed) {
            const completionMark = document.createElement("span");
            const burstClass = task === taskToCelebrate ? " is-bursting" : "";
            completionMark.className = `completion-graffiti variation-${completionMarks.indexOf(task.completionMark) + 1}${burstClass}`;
            completionMark.textContent = task.completionMark;
            completionMark.setAttribute("aria-label", `Completed: ${task.completionMark}`);
            title.append(completionMark);
        }

        const serialCell = document.createElement("td");
        serialCell.className = "row-number";
        serialCell.textContent = String(rowIndex + 1);

        const taskCell = document.createElement("td");
        taskCell.className = "task-cell";
        const taskInfo = document.createElement("div");
        taskInfo.className = "task-info";
        const titleLine = document.createElement("div");
        titleLine.className = "task-title-line";
        titleLine.append(title);
        let notesPanel = null;
        if (task.notes) {
            notesPanel = createNotesPanel(task, index, "table", "task-notes-text");
            titleLine.append(createNotesToggle(index, "table", notesPanel));
        }
        taskInfo.append(titleLine);
        if (notesPanel) taskInfo.append(notesPanel);

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

        taskCell.replaceChildren(taskInfo, createTaskActions(index, task));
        row.append(serialCell, taskCell, categoryCell, dueDateCell, priorityCell);
        todolist.append(row);

        const card = createTaskCard(task, index);
        taskCards.append(card);
        if (task === taskToRestore) card.classList.add("is-restoring");
        else if (task === taskToAnimate || task === taskToCelebrate) card.classList.add(task === taskToCelebrate ? "is-completing" : "is-entering");
    });

    tableWrap.hidden = viewMode !== "table";
    taskCards.hidden = viewMode !== "cards";

    taskToAnimate = null;
    taskToCelebrate = null;
    taskToRestore = null;
    updateProgress();
}

function compareTasks(left, right) {
    const priorityRank = { High: 0, Medium: 1, Low: 2 };
    if (sortMode === "created-oldest") return left.createdAt - right.createdAt;
    if (sortMode === "priority-high") return priorityRank[left.priority] - priorityRank[right.priority] || right.createdAt - left.createdAt;
    if (sortMode === "priority-low") return priorityRank[right.priority] - priorityRank[left.priority] || right.createdAt - left.createdAt;
    if (sortMode === "due-soonest" || sortMode === "due-latest") {
        if (!left.dueDate && right.dueDate) return 1;
        if (left.dueDate && !right.dueDate) return -1;
        const order = left.dueDate.localeCompare(right.dueDate);
        return (sortMode === "due-latest" ? -order : order) || right.createdAt - left.createdAt;
    }
    if (sortMode.startsWith("category-")) {
        const firstCategory = sortMode.slice("category-".length);
        const categoryOrder = (category) => category.toLowerCase() === firstCategory ? 0 : 1;
        return categoryOrder(left.category) - categoryOrder(right.category)
            || left.category.localeCompare(right.category)
            || right.createdAt - left.createdAt;
    }
    return right.createdAt - left.createdAt;
}

function createTaskActions(index, task) {
    const actions = document.createElement("div");
    actions.className = "table-actions";
    const definitions = task.deleted
        ? [["restore", "Restore task", "fa-solid fa-rotate-left", "restore-btn"], ["permanent-delete", "Delete permanently", "fa-regular fa-trash-can", "delete-btn"]]
        : [
            ["toggle-completion", task.completed ? "Mark active" : "Mark complete", task.completed ? "fa-solid fa-circle-check" : "fa-regular fa-circle-check", "complete-btn"],
            ["edit", "Edit task", "fa-solid fa-pen", "edit-btn"],
            ["delete", "Move task to Trash", "fa-regular fa-trash-can", "delete-btn"]
        ];
    definitions.forEach(([action, label, iconClass, styleClass]) => {
        const button = document.createElement("button");
        button.className = `table-action-btn icon-action-btn ${styleClass}`;
        button.type = "button";
        button.dataset.action = action;
        button.dataset.index = index;
        button.setAttribute("aria-label", label);
        button.title = label;
        if (action === "toggle-completion") button.setAttribute("aria-pressed", String(task.completed));
        const icon = document.createElement("i");
        icon.className = iconClass;
        icon.setAttribute("aria-hidden", "true");
        button.append(icon);
        actions.append(button);
    });
    return actions;
}

function createNotesPanel(task, index, presentation, className) {
    const panel = document.createElement("p");
    panel.id = `task-notes-${presentation}-${index}`;
    panel.className = className;
    panel.textContent = task.notes;
    panel.hidden = true;
    return panel;
}

function createNotesToggle(index, presentation, panel) {
    const button = document.createElement("button");
    button.className = "notes-toggle";
    button.type = "button";
    button.dataset.action = "toggle-notes";
    button.dataset.index = index;
    button.setAttribute("aria-label", "Show task notes");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", panel.id);
    button.title = "Show notes";
    const icon = document.createElement("i");
    icon.className = "fa-regular fa-note-sticky";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);
    return button;
}

function createTaskCard(task, index) {
    const card = document.createElement("article");
    card.className = `task-card priority-${task.priority.toLowerCase()}${task.completed ? " completed" : ""}${task.deleted ? " deleted" : ""}`;
    const title = document.createElement("h3");
    title.className = "task-card-title";
    title.textContent = task.text;
    if (task.completed) {
        const mark = document.createElement("span");
        mark.className = `completion-graffiti variation-${completionMarks.indexOf(task.completionMark) + 1}`;
        mark.textContent = task.completionMark;
        title.append(mark);
    }
    const titleLine = document.createElement("div");
    titleLine.className = "task-title-line";
    titleLine.append(title);
    let notesPanel = null;
    if (task.notes) {
        notesPanel = createNotesPanel(task, index, "cards", "task-card-notes");
        titleLine.append(createNotesToggle(index, "cards", notesPanel));
    }
    const header = document.createElement("div");
    header.className = "task-card-header";
    const priority = document.createElement("span");
    priority.className = `task-card-priority priority-${task.priority.toLowerCase()}`;
    priority.textContent = task.priority;
    header.append(titleLine, priority);

    const metadata = document.createElement("div");
    metadata.className = "task-card-meta";
    const category = document.createElement("span");
    category.className = `category-tag tag-${task.category.toLowerCase()}`;
    category.textContent = task.category;
    const due = document.createElement("span");
    due.className = `task-card-due${task.dueDate ? " has-date" : " no-date"}`;
    const dueIcon = document.createElement("i");
    dueIcon.className = "fa-regular fa-calendar";
    dueIcon.setAttribute("aria-hidden", "true");
    due.append(dueIcon, document.createTextNode(task.dueDate ? calendarDateFormatter.format(parseISODate(task.dueDate)) : "No due date"));
    metadata.append(category, due);

    const status = document.createElement("span");
    status.className = `task-card-status${task.completed ? " is-complete" : ""}${task.deleted ? " is-deleted" : ""}`;
    status.textContent = task.deleted ? "In trash" : task.completed ? "Completed" : "Active";

    card.append(header);
    if (notesPanel) card.append(notesPanel);
    card.append(metadata, status, createTaskActions(index, task));
    return card;
}

function launchCelebration(variation, fullCompletion = false) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const overlay = document.createElement("div");
    overlay.className = `celebration-overlay variation-${(variation % 5) + 1}`;
    overlay.setAttribute("aria-hidden", "true");

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const launchX = Math.max(26, window.innerWidth * 0.045);
    const fromTop = variation === 5;
    const origins = fullCompletion
        ? [{ side: "left", top: true }, { side: "right", top: true }, { side: "left", top: false }, { side: "right", top: false }]
        : [{ side: "left", top: fromTop }, { side: "right", top: fromTop }];

    origins.forEach(({ side, top }) => {
        const startX = side === "left" ? launchX : window.innerWidth - launchX;
        const launchY = top ? 28 : window.innerHeight - 28;
        const launcher = document.createElement("span");
        launcher.className = `party-popper-launcher from-${side}${top ? "-top" : ""}`;
        overlay.append(launcher);

        for (let particleIndex = 0; particleIndex < 28; particleIndex += 1) {
            const particle = document.createElement("i");
            particle.className = `celebration-particle color-${particleIndex % 5}`;
            particle.style.left = `${startX}px`;
            particle.style.top = `${launchY}px`;
            particle.style.setProperty("--travel-x", `${centerX - startX + (Math.random() - 0.5) * 180}px`);
            particle.style.setProperty("--travel-y", `${centerY - launchY + (Math.random() - 0.5) * 150}px`);
            particle.style.setProperty("--particle-delay", `${Math.random() * 180}ms`);
            overlay.append(particle);
        }
    });

    document.body.append(overlay);
    window.setTimeout(() => overlay.remove(), 1250);
}

function openDeleteModal(index) {
    pendingDeleteIndex = index;
    pendingDeleteMode = storedTodo[index]?.deleted ? "permanent" : "trash";
    deleteModalTitle.textContent = pendingDeleteMode === "permanent" ? "Delete permanently?" : "Move to Trash?";
    deleteModalMessage.textContent = pendingDeleteMode === "permanent"
        ? "This task will be permanently removed and cannot be restored."
        : "This task can be restored later from Trash.";
    confirmDeleteButton.textContent = pendingDeleteMode === "permanent" ? "Delete forever" : "Move to Trash";
    deleteModal.hidden = false;
    confirmDeleteButton.focus();
}

function closeDeleteModal() {
    pendingDeleteIndex = null;
    deleteModal.hidden = true;
}

function deleteTask(index) {
    const task = storedTodo[index];
    const item = viewMode === "cards"
        ? taskCards.querySelector(`button[data-index="${index}"]`)?.closest(".task-card")
        : todolist.querySelector(`button[data-index="${index}"]`)?.closest("tr");
    if (!task || !item) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    item.classList.add("is-removing");
    item.querySelectorAll("button, input").forEach((control) => {
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

        task.deleted = true;
        task.deletedAt = Date.now();
        removeTaskReminders(task.id);
        saveTodos();
        displayTodo();
    }, reduceMotion ? 0 : 660);
}

function permanentlyDeleteTask(index) {
    const task = storedTodo[index];
    const item = viewMode === "cards"
        ? taskCards.querySelector(`button[data-index="${index}"]`)?.closest(".task-card")
        : todolist.querySelector(`button[data-index="${index}"]`)?.closest("tr");
    if (!task || !task.deleted || !item) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    item.classList.add("is-removing");
    item.querySelectorAll("button").forEach((control) => { control.disabled = true; });
    window.setTimeout(() => {
        const taskIndex = storedTodo.indexOf(task);
        if (taskIndex !== -1) storedTodo.splice(taskIndex, 1);
        removeTaskReminders(task.id);
        saveTodos();
        displayTodo();
    }, reduceMotion ? 0 : 660);
}

function restoreTask(index) {
    const task = storedTodo[index];
    if (!task?.deleted) return;
    task.deleted = false;
    task.deletedAt = null;
    taskToRestore = task;
    saveTodos();
    checkReminders();
    setTaskFilter(task.completed ? "completed" : "active");
}

function handleTaskAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const index = Number(button.dataset.index);
    if (button.dataset.action === "toggle-notes") {
        const panel = document.getElementById(button.getAttribute("aria-controls"));
        if (!panel) return;
        const isOpening = panel.hidden;
        panel.hidden = !isOpening;
        button.setAttribute("aria-expanded", String(isOpening));
        button.setAttribute("aria-label", isOpening ? "Hide task notes" : "Show task notes");
        button.title = isOpening ? "Hide notes" : "Show notes";
        return;
    }
    if (button.dataset.action === "toggle-completion") {
        const task = storedTodo[index];
        if (!task || task.deleted) return;
        task.completed = !task.completed;
        task.completionMark = task.completed ? getRandomCompletionMark() : "";
        taskToCelebrate = task.completed ? task : null;
        const allTasksCompleted = task.completed && storedTodo
            .filter((item) => !item.deleted)
            .every((item) => item.completed);
        if (task.completed) launchCelebration(Math.floor(Math.random() * 6), allTasksCompleted);
        if (task.completed) removeTaskReminders(task.id);
        saveTodos();
        checkReminders();
        displayTodo();
        return;
    }
    if (button.dataset.action === "delete") {
        openDeleteModal(index);
        return;
    }
    if (button.dataset.action === "restore") {
        restoreTask(index);
        return;
    }
    if (button.dataset.action === "permanent-delete") {
        openDeleteModal(index);
        return;
    }

    const task = storedTodo[index];
    editingIndex = index;
    inputbox.value = task.text;
    taskNotesInput.value = task.notes;
    taskForm.hidden = false;
    taskForm.classList.remove("is-revealing");
    void taskForm.offsetWidth;
    taskForm.classList.add("is-revealing");
    setCategory(task.category);
    dueDateInput.value = task.dueDate;
    updateDueDateLabel();
    setSelectedPriority(task.priority);
    addbtn.textContent = "Save";
    inputbox.focus();
}

function setTheme(isDark, animate = false) {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    const nextTheme = isDark ? "light" : "dark";
    themeIcon.className = isDark ? "fa-solid fa-moon" : "fa-solid fa-sun";
    themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    themeToggle.title = `Switch to ${nextTheme} mode`;
    themeToggle.setAttribute("aria-pressed", String(isDark));
    localStorage.setItem("theme", isDark ? "dark" : "light");
    if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        themeToggle.animate(
            isDark
                ? [{ transform: "rotate(0deg) scale(1)" }, { transform: "rotate(-12deg) scale(0.9)" }, { transform: "rotate(0deg) scale(1)" }]
                : [{ transform: "rotate(0deg) scale(1)" }, { transform: "rotate(12deg) scale(1.08)" }, { transform: "rotate(0deg) scale(1)" }],
            { duration: 440, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
        );
        themeIcon.animate(
            isDark
                ? [{ transform: "rotate(0deg) scale(1)" }, { transform: "rotate(-150deg) scale(0.5)" }, { transform: "rotate(-360deg) scale(1)" }]
                : [{ transform: "rotate(0deg) scale(1)" }, { transform: "rotate(180deg) scale(0.65)" }, { transform: "rotate(360deg) scale(1)" }],
            { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
    }
}

taskForm.addEventListener("submit", handleAddTask);
todolist.addEventListener("click", handleTaskAction);
todolist.addEventListener("change", handleTaskAction);
taskCards.addEventListener("click", handleTaskAction);
taskCards.addEventListener("change", handleTaskAction);
cancelDeleteButton.addEventListener("click", closeDeleteModal);
confirmDeleteButton.addEventListener("click", () => {
    const index = pendingDeleteIndex;
    const mode = pendingDeleteMode;
    closeDeleteModal();
    if (index !== null) {
        if (mode === "permanent") permanentlyDeleteTask(index);
        else deleteTask(index);
    }
});
deleteModal.addEventListener("click", (event) => {
    if (event.target === deleteModal) closeDeleteModal();
});
searchInput.addEventListener("input", displayTodo);
nextMotivationButton.addEventListener("click", showNextMotivationQuote);
remindersToggle.addEventListener("click", () => {
    const isOpening = remindersPanel.hidden;
    remindersPanel.hidden = !isOpening;
    remindersToggle.setAttribute("aria-expanded", String(isOpening));
    renderReminderCenter();
});
notificationPermissionButton.addEventListener("click", async () => {
    if (typeof window.Notification !== "function") {
        renderReminderCenter();
        return;
    }
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") reminderInbox.filter((reminder) => !reminder.dismissed).slice(0, 3).forEach(sendBrowserReminder);
    } catch {
        notificationStatus.textContent = "Browser permission could not be requested; in-app reminders remain enabled.";
    }
    renderReminderCenter();
});
reminderList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-reminder-action]");
    if (!button) return;
    const reminderId = button.dataset.reminderId;
    if (button.dataset.reminderAction === "dismiss") {
        const reminder = reminderInbox.find((item) => item.id === reminderId);
        if (reminder) reminder.dismissed = true;
        saveReminderInbox();
        renderReminderCenter();
        return;
    }
    const reminder = reminderInbox.find((item) => item.id === reminderId);
    const task = storedTodo.find((item) => item.id === reminder?.taskId);
    if (!task) return;
    searchInput.value = "";
    focusedTaskId = task.id;
    updateTaskFocusBar();
    setTaskFilter(task.deleted ? "deleted" : task.completed ? "completed" : "active");
    remindersPanel.hidden = true;
    remindersToggle.setAttribute("aria-expanded", "false");
});
document.addEventListener("click", (event) => {
    if (!event.target.closest(".reminder-control")) {
        remindersPanel.hidden = true;
        remindersToggle.setAttribute("aria-expanded", "false");
    }
});
categoryPicker.addEventListener("pointerenter", () => openCategoryPicker());
categoryPicker.addEventListener("pointerleave", () => {
    if (!categoryPicker.contains(document.activeElement)) closeCategoryPicker();
});
categoryPicker.addEventListener("focusin", () => {
    if (!categoryFocusRestoreInProgress) openCategoryPicker();
});
categoryPicker.addEventListener("focusout", (event) => {
    if (!categoryPicker.contains(event.relatedTarget)) closeCategoryPicker();
});
categoryTrigger.addEventListener("click", () => openCategoryPicker(true));
categoryTrigger.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openCategoryPicker(true);
    } else if (event.key === "Escape") {
        closeCategoryPicker();
    }
});
categoryOptions.addEventListener("click", (event) => {
    const option = event.target.closest("[role='option']");
    if (!option) return;
    setCategory(option.dataset.category);
    closeCategoryPicker(true);
});
categoryOptions.addEventListener("keydown", (event) => {
    const options = Array.from(categoryOptions.querySelectorAll("[role='option']"));
    const currentIndex = options.indexOf(document.activeElement);
    if (event.key === "Escape") {
        event.preventDefault();
        closeCategoryPicker(true);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const nextIndex = event.key === "Home"
            ? 0
            : event.key === "End"
                ? options.length - 1
                : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
        options[nextIndex]?.focus();
    }
});
document.addEventListener("click", (event) => {
    if (!categoryPicker.contains(event.target)) closeCategoryPicker();
});
function setTaskFilter(filter) {
    taskFilter = filter;
    document.querySelectorAll(".task-view-filter").forEach((filterButton) => {
        const isActive = filterButton.dataset.filter === filter;
        filterButton.classList.toggle("is-active", isActive);
        filterButton.classList.toggle("active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
    });
    document.getElementById("page-section-title").textContent = {
        active: "Active tasks",
        completed: "Completed tasks",
        deleted: "Trash"
    }[filter];
    displayTodo();
}

document.querySelectorAll(".task-view-filter").forEach((button) => {
    button.addEventListener("click", () => {
        focusedTaskId = null;
        updateTaskFocusBar();
        setTaskFilter(button.dataset.filter);
        setNavigationOpen(false);
    });
});

openAddTaskButton.addEventListener("click", () => {
    focusedTaskId = null;
    updateTaskFocusBar();
    setTaskFilter("active");
    setNavigationOpen(false);
    taskForm.hidden = false;
    taskForm.classList.remove("is-revealing");
    void taskForm.offsetWidth;
    taskForm.classList.add("is-revealing");
    taskForm.scrollIntoView({ behavior: "smooth", block: "start" });
    inputbox.focus({ preventScroll: true });
});

clearTaskFocusButton.addEventListener("click", () => {
    focusedTaskId = null;
    updateTaskFocusBar();
    displayTodo();
});

function setNavigationOpen(isOpen) {
    sidebar.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close task menu" : "Open task menu");
    drawerBackdrop.hidden = !isOpen;
}

function closeSortMenu() {
    sortMenu.hidden = true;
    sortTrigger.setAttribute("aria-expanded", "false");
    sortMenu.querySelectorAll(".submenu-options").forEach((submenu) => { submenu.hidden = true; });
    sortMenu.querySelectorAll(".submenu-trigger").forEach((button) => button.setAttribute("aria-expanded", "false"));
}

function setSortMenuOpen(isOpen) {
    sortMenu.hidden = !isOpen;
    sortTrigger.setAttribute("aria-expanded", String(isOpen));
    if (!isOpen) closeSortMenu();
}

function setViewMenuOpen(isOpen) {
    viewMenu.hidden = !isOpen;
    viewTrigger.setAttribute("aria-expanded", String(isOpen));
}

function updateSortControls() {
    sortMenu.querySelectorAll("[data-sort]").forEach((button) => {
        const isSelected = button.dataset.sort === sortMode;
        button.setAttribute("role", "menuitemradio");
        button.setAttribute("aria-checked", String(isSelected));
    });
}

function updateViewControls() {
    document.querySelectorAll("[data-view]").forEach((button) => {
        button.setAttribute("aria-checked", String(button.dataset.view === viewMode));
    });
    tableWrap.hidden = viewMode !== "table";
    taskCards.hidden = viewMode !== "cards";
}

sortDrawer.addEventListener("pointerenter", () => setSortMenuOpen(true));
sortDrawer.addEventListener("pointerleave", (event) => {
    if (!sortDrawer.contains(event.relatedTarget) && !sortDrawer.contains(document.activeElement)) setSortMenuOpen(false);
});
sortTrigger.addEventListener("click", () => setSortMenuOpen(true));
sortMenu.querySelectorAll(".sort-submenu").forEach((wrapper) => {
    const trigger = wrapper.querySelector(".submenu-trigger");
    const submenu = wrapper.querySelector(".submenu-options");
    const openSubmenu = (isOpen) => {
        submenu.hidden = !isOpen;
        trigger.setAttribute("aria-expanded", String(isOpen));
    };
    wrapper.addEventListener("pointerenter", () => openSubmenu(true));
    wrapper.addEventListener("pointerleave", (event) => {
        if (!wrapper.contains(event.relatedTarget) && !wrapper.contains(document.activeElement)) openSubmenu(false);
    });
    trigger.addEventListener("click", () => openSubmenu(true));
});
sortMenu.addEventListener("click", (event) => {
    const option = event.target.closest("[data-sort]");
    if (!option) return;
    sortMode = option.dataset.sort;
    localStorage.setItem("todoSort", sortMode);
    updateSortControls();
    displayTodo();
    setSortMenuOpen(false);
});
viewDrawer.addEventListener("pointerenter", () => setViewMenuOpen(true));
viewDrawer.addEventListener("pointerleave", (event) => {
    if (!viewDrawer.contains(event.relatedTarget) && !viewDrawer.contains(document.activeElement)) setViewMenuOpen(false);
});
viewTrigger.addEventListener("click", () => setViewMenuOpen(true));
viewMenu.addEventListener("click", (event) => {
    const option = event.target.closest("[data-view]");
    if (!option) return;
    viewMode = option.dataset.view;
    localStorage.setItem("todoView", viewMode);
    updateViewControls();
    displayTodo();
    setViewMenuOpen(false);
});
menuToggle.addEventListener("click", () => setNavigationOpen(menuToggle.getAttribute("aria-expanded") !== "true"));
drawerBackdrop.addEventListener("click", () => setNavigationOpen(false));
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
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") setNavigationOpen(false);
    if (event.key === "Escape" && !sortMenu.hidden) setSortMenuOpen(false);
    if (event.key === "Escape" && !viewMenu.hidden) setViewMenuOpen(false);
    if (event.key === "Escape" && !remindersPanel.hidden) {
        remindersPanel.hidden = true;
        remindersToggle.setAttribute("aria-expanded", "false");
    }
});
themeToggle.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme !== "dark", true);
});

setTheme(localStorage.getItem("theme") === "dark");
updateSortControls();
updateViewControls();
setTaskFilter("active");
updateDueDateLabel();
displayTodo();
showNextMotivationQuote();
renderReminderCenter();
checkReminders();
window.setInterval(checkReminders, 60000);