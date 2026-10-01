if (typeof document === "undefined") { process.exit(0); }

const svgIcons = {
    briefcase: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    user: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    fire: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"></path></svg>',
    tag: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
    calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    flag: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>',
    edit: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    trash: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    folder: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
};

const inputbox = document.getElementById("task-input");
const taskDesc = document.getElementById("task-desc");
const categorySelect = document.getElementById("category-select");
const dueDateInput = document.getElementById("due-date");
const dueDateTrigger = document.getElementById("due-date-trigger");
const dueDateLabel = document.getElementById("due-date-label");
const calendarPopover = document.getElementById("calendar-popover");
const calendarMonth = document.getElementById("calendar-month");
const calendarDays = document.getElementById("calendar-days");
const priorityInputs = document.querySelectorAll('input[name="priority"]');
const taskForm = document.getElementById("task-form");
const addbtn = document.getElementById("addbtn");
const cardsGrid = document.getElementById("cards-grid");
const themeToggle = document.getElementById("theme-toggle");
const searchInput = document.getElementById("search-input");
const progressBar = document.getElementById("progress-bar");
const progressStats = document.getElementById("progress-stats");
const progressTrack = document.querySelector(".progress-track");
const quickAddButton = document.getElementById("quick-add-btn");
const logoHomeBtn = document.getElementById("logo-home-btn");
const toggleFormBtn = document.getElementById("toggle-form-btn");
const closeFormBtn = document.getElementById("close-form-btn");
const resetFormBtn = document.getElementById("reset-form-btn");
const formHeading = document.getElementById("form-heading");
const sectionHeadingText = document.getElementById("section-heading-text");
const countAll = document.getElementById("count-all");
const countActive = document.getElementById("count-active");
const countCompleted = document.getElementById("count-completed");

const calendarDateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
let editingIndex = null;
const currentDate = new Date();
let visibleMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
let taskToAnimate = null;
let taskFilter = "all";

const defaultTasks = [
    { text: "Complete dashboard UI redesign", description: "Implement modern card interface with responsive layout and theme switcher", category: "Work", dueDate: "2026-10-05", priority: "High", completed: false },
    { text: "Review pull requests and feedback", description: "Check recent codebase updates and review team suggestions", category: "Work", dueDate: "2026-10-03", priority: "Medium", completed: false },
    { text: "Prepare weekly summary report", description: "Draft key achievements and project milestones for the week", category: "Work", dueDate: "2026-10-06", priority: "Medium", completed: false },
    { text: "Grocery shopping & pantry restock", description: "Buy fresh vegetables, fruits, and weekly household supplies", category: "Personal", dueDate: "2026-10-02", priority: "Low", completed: false },
    { text: "Fix critical payment gateway issue", description: "Resolve API authentication error in payment callback webhook", category: "Urgent", dueDate: "2026-10-01", priority: "High", completed: false },
    { text: "Schedule routine health checkup", description: "Book annual medical examination appointment with doctor", category: "Personal", dueDate: "2026-10-08", priority: "Medium", completed: true }
];

function toISODate(date) { 
    const year = date.getFullYear(); 
    const month = String(date.getMonth() + 1).padStart(2, "0"); 
    const day = String(date.getDate()).padStart(2, "0"); 
    return year + "-" + month + "-" + day; 
}

function parseISODate(value) { 
    if (!value) return null; 
    const parts = value.split("-").map(Number); 
    return new Date(parts[0], parts[1] - 1, parts[2]); 
}

function updateDueDateLabel() { 
    const selectedDate = parseISODate(dueDateInput.value); 
    dueDateLabel.textContent = selectedDate ? calendarDateFormatter.format(selectedDate) : "Choose a date"; 
}

function getCategoryInfo(category) {
    if (category === "Work") return { name: "Work", icon: svgIcons.briefcase };
    if (category === "Personal") return { name: "Personal", icon: svgIcons.user };
    if (category === "Urgent") return { name: "Urgent", icon: svgIcons.fire };
    return { name: category || "Task", icon: svgIcons.check };
}

function getPriorityDisplay(priority) {
    if (priority === "High") return { label: "High", class: "priority-high" };
    if (priority === "Low") return { label: "Low", class: "priority-low" };
    return { label: "Medium", class: "priority-medium" };
}

function renderCalendar() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const selectedDate = dueDateInput.value;
    const today = toISODate(new Date());
    const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    calendarMonth.textContent = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(visibleMonth);
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
        if (isoDate === today) { dayButton.classList.add("is-today"); dayButton.setAttribute("aria-current", "date"); }
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

function getSelectedPriority() { return document.querySelector('input[name="priority"]:checked')?.value || "Medium"; }
function setSelectedPriority(priority) { priorityInputs.forEach((input) => { input.checked = input.value === priority; }); }

const savedData = localStorage.getItem("todos");
let storedTodo = savedData ? JSON.parse(savedData) : null;
if (!storedTodo || !Array.isArray(storedTodo) || storedTodo.length === 0) {
    storedTodo = defaultTasks;
}
storedTodo = storedTodo.map((task) => {
    if (typeof task === "string") {
        return { text: task, description: "", dueDate: "", priority: "Medium", category: "Personal", completed: false };
    }
    return {
        text: task.text || "Untitled Task",
        description: task.description || "",
        dueDate: task.dueDate || "",
        priority: ["High", "Medium", "Low"].includes(task.priority) ? task.priority : "Medium",
        category: ["Work", "Personal", "Urgent"].includes(task.category) ? task.category : "Work",
        completed: Boolean(task.completed)
    };
});

function saveTodos() { localStorage.setItem("todos", JSON.stringify(storedTodo)); }

function updateProgress() {
    const total = storedTodo.length;
    const completed = storedTodo.filter((task) => task.completed).length;
    const active = total - completed;
    const percentage = total ? Math.round((completed / total) * 100) : 0;
    if (progressBar) progressBar.style.width = percentage + "%";
    if (progressStats) progressStats.textContent = percentage + "% completed (" + completed + "/" + total + ")";
    if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(percentage));
    if (countAll) countAll.textContent = String(total);
    if (countActive) countActive.textContent = String(active);
    if (countCompleted) countCompleted.textContent = String(completed);
}

function openForm(isEdit = false) {
    taskForm.style.display = "flex";
    if (!isEdit) { formHeading.textContent = "Create New Task"; addbtn.textContent = "ADD TASK"; }
    inputbox.focus();
}

function closeForm() {
    taskForm.style.display = "none";
    taskForm.reset();
    if (taskDesc) taskDesc.value = "";
    updateDueDateLabel();
    closeCalendar();
    editingIndex = null;
    formHeading.textContent = "Create New Task";
    addbtn.textContent = "ADD TASK";
}

function handleAddTask(event) {
    event.preventDefault();
    const taskName = inputbox.value.trim();
    if (!taskName) return;
    const task = {
        text: taskName,
        description: taskDesc ? taskDesc.value.trim() : "",
        dueDate: dueDateInput.value || "",
        priority: getSelectedPriority(),
        category: categorySelect.value,
        completed: editingIndex === null ? false : storedTodo[editingIndex].completed
    };
    if (editingIndex === null) {
        taskToAnimate = task;
        storedTodo.unshift(task);
    } else {
        storedTodo[editingIndex] = task;
    }
    saveTodos();
    displayTodo();
    closeForm();
}

function displayTodo() {
    cardsGrid.replaceChildren();
    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const visibleTasks = storedTodo
        .map((task, index) => ({ task, index }))
        .filter(({ task }) => {
            const matchesQuery = (task.text + " " + task.category + " " + task.description).toLowerCase().includes(query);
            const matchesView = taskFilter === "all" || (taskFilter === "active" && !task.completed) || (taskFilter === "completed" && task.completed);
            return matchesQuery && matchesView;
        });

    if (visibleTasks.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state-card";
        emptyState.innerHTML = '<div class="empty-state-icon">' + svgIcons.folder + '</div><h4 class="empty-state-title">No tasks found</h4><p class="empty-state-text">' + (query ? "No tasks match your search filter." : "No tasks available in this section.") + '</p>';
        cardsGrid.append(emptyState);
        taskToAnimate = null;
        updateProgress();
        return;
    }

    visibleTasks.forEach(({ task, index }) => {
        const catInfo = getCategoryInfo(task.category);
        const priorityMeta = getPriorityDisplay(task.priority);
        const formattedDate = task.dueDate ? calendarDateFormatter.format(parseISODate(task.dueDate)) : "No due date";
        const descText = task.description || "No additional notes.";
        const isNoDueDate = !task.dueDate;
        const card = document.createElement("article");
        card.className = "task-card" + (task.completed ? " completed" : "");
        if (task === taskToAnimate) card.classList.add("is-entering");
        card.innerHTML = [
            '<div class="card-header-row">',
            '  <div class="category-identity">',
            '    <div class="category-icon-circle">',
            '      ' + catInfo.icon,
            '    </div>',
            '    <span class="category-title-text">' + catInfo.name + '</span>',
            '  </div>',
            '  <div class="priority-score-badge ' + priorityMeta.class + '">',
            '    <span class="priority-flag-icon">' + svgIcons.flag + '</span>',
            '    <span>' + priorityMeta.label + '</span>',
            '  </div>',
            '</div>',
            '<div class="card-meta-boxes-row">',
            '  <div class="meta-sub-box">',
            '    <span class="meta-icon">' + svgIcons.tag + '</span>',
            '    <div class="meta-info-col">',
            '      <span class="meta-label">Category</span>',
            '      <span class="meta-value">' + task.category + '</span>',
            '    </div>',
            '  </div>',
            '  <div class="meta-sub-box">',
            '    <span class="meta-icon">' + svgIcons.calendar + '</span>',
            '    <div class="meta-info-col">',
            '      <span class="meta-label">Due date</span>',
            '      <span class="meta-value' + (isNoDueDate ? ' is-muted' : '') + '">' + formattedDate + '</span>',
            '    </div>',
            '  </div>',
            '</div>',
            '<div class="card-body-content">',
            '  <h3 class="task-title">' + task.text + '</h3>',
            '  <p class="task-description">' + descText + '</p>',
            '</div>',
            '<div class="card-actions-row">',
            '  <button type="button" class="btn-edit-task" data-action="edit" data-index="' + index + '">' + svgIcons.edit + ' <span>Edit</span></button>',
            '  <button type="button" class="btn-toggle-task' + (task.completed ? " is-completed" : "") + '" data-action="toggle-complete" data-index="' + index + '">' + svgIcons.check + ' <span>' + (task.completed ? "Completed" : "Mark Done") + '</span></button>',
            '  <button type="button" class="btn-delete-task" data-action="delete" data-index="' + index + '" title="Delete task" aria-label="Delete task">' + svgIcons.trash + ' <span>Delete</span></button>',
            '</div>'
        ].join("");
        cardsGrid.append(card);
    });
    taskToAnimate = null;
    updateProgress();
}

function handleCardAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const index = Number(button.dataset.index);
    const task = storedTodo[index];
    if (!task) return;
    if (action === "toggle-complete") {
        task.completed = !task.completed;
        saveTodos();
        displayTodo();
        return;
    }
    if (action === "edit") {
        editingIndex = index;
        inputbox.value = task.text;
        if (taskDesc) taskDesc.value = task.description || "";
        categorySelect.value = task.category;
        dueDateInput.value = task.dueDate;
        updateDueDateLabel();
        setSelectedPriority(task.priority);
        formHeading.textContent = "Edit Task Details";
        addbtn.textContent = "Save Changes";
        openForm(true);
        window.scrollTo({ top: taskForm.offsetTop - 30, behavior: "smooth" });
        return;
    }
    if (action === "delete") {
        const card = button.closest(".task-card");
        if (card) {
            card.classList.add("is-removing");
            card.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
            setTimeout(() => {
                const taskIndex = storedTodo.indexOf(task);
                if (taskIndex !== -1) {
                    storedTodo.splice(taskIndex, 1);
                    saveTodos();
                    displayTodo();
                }
            }, 180);
        } else {
            storedTodo.splice(index, 1);
            saveTodos();
            displayTodo();
        }
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem("todo-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcons(savedTheme);
}

function updateThemeIcons(theme) {
    const sunIcon = document.querySelector(".sun-icon");
    const moonIcon = document.querySelector(".moon-icon");
    if (!sunIcon || !moonIcon) return;
    if (theme === "dark") {
        moonIcon.classList.add("active-theme-icon");
        sunIcon.classList.remove("active-theme-icon");
    } else {
        sunIcon.classList.add("active-theme-icon");
        moonIcon.classList.remove("active-theme-icon");
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("todo-theme", newTheme);
    updateThemeIcons(newTheme);
}

function setViewFilter(filter) {
    taskFilter = filter;
    document.querySelectorAll(".task-view-filter").forEach((button) => {
        const isActive = button.dataset.filter === filter;
        button.classList.toggle("is-active", isActive);
        button.classList.toggle("active", isActive);
        if (button.hasAttribute("aria-pressed")) {
            button.setAttribute("aria-pressed", String(isActive));
        }
    });
    const titles = { all: "My Tasks", active: "Active Tasks", completed: "Completed Tasks" };
    if (sectionHeadingText) sectionHeadingText.textContent = titles[filter] || "My Tasks";
    displayTodo();
}

function setupEventListeners() {
    if (taskForm) taskForm.addEventListener("submit", handleAddTask);
    if (cardsGrid) cardsGrid.addEventListener("click", handleCardAction);
    if (toggleFormBtn) toggleFormBtn.addEventListener("click", () => {
        if (taskForm.style.display === "none" || !taskForm.style.display) openForm(false);
        else closeForm();
    });
    if (quickAddButton) quickAddButton.addEventListener("click", () => openForm(false));
    if (closeFormBtn) closeFormBtn.addEventListener("click", closeForm);
    if (resetFormBtn) resetFormBtn.addEventListener("click", closeForm);
    if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
    if (searchInput) searchInput.addEventListener("input", displayTodo);
    if (logoHomeBtn) logoHomeBtn.addEventListener("click", () => setViewFilter("all"));

    document.querySelectorAll(".task-view-filter").forEach((btn) => {
        btn.addEventListener("click", () => setViewFilter(btn.dataset.filter));
    });

    if (dueDateTrigger) {
        dueDateTrigger.addEventListener("click", () => {
            const isHidden = calendarPopover.hidden;
            if (isHidden) {
                renderCalendar();
                calendarPopover.hidden = false;
                dueDateTrigger.setAttribute("aria-expanded", "true");
            } else {
                closeCalendar();
            }
        });
    }

    const calPrev = document.getElementById("calendar-previous");
    const calNext = document.getElementById("calendar-next");
    const calClear = document.getElementById("calendar-clear");
    const calToday = document.getElementById("calendar-today");

    if (calPrev) calPrev.addEventListener("click", () => changeCalendarMonth(-1));
    if (calNext) calNext.addEventListener("click", () => changeCalendarMonth(1));
    if (calClear) calClear.addEventListener("click", () => {
        dueDateInput.value = "";
        updateDueDateLabel();
        closeCalendar(true);
    });
    if (calToday) calToday.addEventListener("click", () => {
        dueDateInput.value = toISODate(new Date());
        updateDueDateLabel();
        closeCalendar(true);
    });

    if (calendarDays) {
        calendarDays.addEventListener("click", (e) => {
            const btn = e.target.closest(".calendar-day");
            if (!btn || !btn.dataset.date) return;
            dueDateInput.value = btn.dataset.date;
            updateDueDateLabel();
            closeCalendar(true);
        });
    }

    document.addEventListener("click", (e) => {
        if (!calendarPopover.hidden && !calendarPopover.contains(e.target) && !dueDateTrigger.contains(e.target)) {
            closeCalendar();
        }
    });
}

initTheme();
setupEventListeners();
displayTodo();
