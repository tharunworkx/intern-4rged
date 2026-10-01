let inputbox = document.querySelector("input");
let addbtn = document.getElementById("addbtn");
let todolist = document.querySelector("ul");
let clearCompletedBtn = document.getElementById("clear-completed");
let syntheticE;
let editingIndex = null;

// Normalize tasks from localStorage to support both legacy string arrays and {text, completed} objects
let storedTodo = (JSON.parse(localStorage.getItem("todos")) || []).map((item) => {
    if (typeof item === "string") {
        return { text: item, completed: false };
    }
    return {
        text: item && item.text !== undefined ? item.text : "",
        completed: Boolean(item && item.completed)
    };
});

function escapeHtml(str) {
    let div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function updateTaskCount() {
    let taskCountElem = document.getElementById("task-count");
    if (!taskCountElem) return;
    let pendingCount = storedTodo.filter((task) => !task.completed).length;
    let text = pendingCount === 1 ? "1 task remaining" : `${pendingCount} tasks remaining`;
    taskCountElem.textContent = text;
}

function handleAddtask() {
    if (inputbox.value.trim().length > 0) {
        let inputboxvalue = inputbox.value.trim();
        if (addbtn.innerHTML === "Save" && editingIndex !== null && editingIndex !== undefined) {
            if (storedTodo[editingIndex]) {
                storedTodo[editingIndex].text = inputboxvalue;
            }
            localStorage.setItem("todos", JSON.stringify(storedTodo));
            inputbox.value = "";
            addbtn.innerHTML = "Add";
            editingIndex = null;
        } else {
            storedTodo.push({
                text: inputboxvalue,
                completed: false
            });
            localStorage.setItem("todos", JSON.stringify(storedTodo));
        }
    }
    inputbox.value = "";
    displayTodo();
}

function displayTodo() {
    todolist.innerHTML = "";
    storedTodo.forEach((task, index) => {
        let list = document.createElement("li");
        list.setAttribute("draggable", "true");
        list.setAttribute("aria-grabbed", "false");
        list.dataset.index = index;
        if (task.completed) {
            list.classList.add("completed-task");
        }
        list.innerHTML = `
            <div class="task ${task.completed ? 'completed' : ''}" data-index="${index}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task as complete">
                <span class="task-text">${escapeHtml(task.text)}</span>
            </div>
            <div class="btn-container">
                <button class="edit-btn" data-index="${index}">Edit</button>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </div>`;
        todolist.append(list);
    });
    updateTaskCount();
}
displayTodo();

function handleClearCompleted() {
    storedTodo = storedTodo.filter((task) => !task.completed);
    localStorage.setItem("todos", JSON.stringify(storedTodo));
    if (editingIndex !== null && editingIndex !== undefined) {
        if (!storedTodo[editingIndex]) {
            editingIndex = null;
            inputbox.value = "";
            addbtn.innerHTML = "Add";
        }
    }
    displayTodo();
}

// ----------------------------------------------------
// Drag & Drop Reordering (Desktop & Touch)
// ----------------------------------------------------
let draggedElement = null;
let draggedIndex = -1;
let currentTargetLi = null;
let currentDropPosition = null;
let hasJustDragged = false;

function clearDropIndicators() {
    todolist.querySelectorAll("li").forEach((li) => {
        li.classList.remove("drop-target-before", "drop-target-after");
    });
}

function cleanUpDrag() {
    clearDropIndicators();
    if (draggedElement) {
        draggedElement.classList.remove("dragging");
        draggedElement.setAttribute("aria-grabbed", "false");
    }
    draggedElement = null;
    draggedIndex = -1;
    currentTargetLi = null;
    currentDropPosition = null;

    hasJustDragged = true;
    setTimeout(() => {
        hasJustDragged = false;
    }, 150);
}

function executeReorder(fromIndex, toIndex, position) {
    if (fromIndex === toIndex && (position === "before" || position === "after")) {
        return;
    }
    if (fromIndex < 0 || fromIndex >= storedTodo.length) return;
    if (toIndex < 0 || toIndex >= storedTodo.length) return;

    let currentlyEditedTask = (editingIndex !== null && editingIndex >= 0 && editingIndex < storedTodo.length)
        ? storedTodo[editingIndex]
        : null;

    let [movedItem] = storedTodo.splice(fromIndex, 1);
    
    let targetIndexInRemaining = toIndex;
    if (fromIndex < toIndex) {
        targetIndexInRemaining = toIndex - 1;
    }

    let insertionIndex = position === "before" ? targetIndexInRemaining : targetIndexInRemaining + 1;
    insertionIndex = Math.max(0, Math.min(storedTodo.length, insertionIndex));

    storedTodo.splice(insertionIndex, 0, movedItem);

    if (currentlyEditedTask) {
        let newEditIdx = storedTodo.indexOf(currentlyEditedTask);
        editingIndex = newEditIdx !== -1 ? newEditIdx : null;
    }

    localStorage.setItem("todos", JSON.stringify(storedTodo));
    displayTodo();
}

// Ensure interactive buttons/inputs don't trigger drag on mousedown
todolist.addEventListener("mousedown", (e) => {
    let li = e.target.closest("li");
    if (!li) return;
    if (e.target.closest("button, input")) {
        li.setAttribute("draggable", "false");
    } else {
        li.setAttribute("draggable", "true");
    }
});

document.addEventListener("mouseup", () => {
    todolist.querySelectorAll("li").forEach((li) => {
        li.setAttribute("draggable", "true");
    });
});

todolist.addEventListener("dragstart", (e) => {
    let li = e.target.closest("li");
    if (!li || li.getAttribute("draggable") === "false" || e.target.closest("button, input")) {
        e.preventDefault();
        return;
    }

    draggedIndex = parseInt(li.dataset.index, 10);
    draggedElement = li;
    li.setAttribute("aria-grabbed", "true");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedIndex.toString());

    setTimeout(() => {
        if (draggedElement) {
            draggedElement.classList.add("dragging");
        }
    }, 0);
});

todolist.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!draggedElement) return;
    e.dataTransfer.dropEffect = "move";

    let targetLi = e.target.closest("li");
    if (!targetLi) {
        let allLis = Array.from(todolist.querySelectorAll("li"));
        if (allLis.length > 0) {
            let lastLi = allLis[allLis.length - 1];
            if (lastLi !== draggedElement) {
                let rect = lastLi.getBoundingClientRect();
                if (e.clientY > rect.bottom || (e.clientY > rect.top && e.clientX > rect.right)) {
                    clearDropIndicators();
                    lastLi.classList.add("drop-target-after");
                    currentTargetLi = lastLi;
                    currentDropPosition = "after";
                    return;
                }
            }
        }
        return;
    }

    if (targetLi === draggedElement) {
        clearDropIndicators();
        currentTargetLi = null;
        currentDropPosition = null;
        return;
    }

    let rect = targetLi.getBoundingClientRect();
    let isVertical = window.innerWidth <= 600 || (Math.abs(e.clientY - (rect.top + rect.height / 2)) / rect.height > Math.abs(e.clientX - (rect.left + rect.width / 2)) / rect.width);
    let position;
    if (isVertical) {
        position = (e.clientY < rect.top + rect.height / 2) ? "before" : "after";
    } else {
        position = (e.clientX < rect.left + rect.width / 2) ? "before" : "after";
    }

    clearDropIndicators();
    if (position === "before") {
        targetLi.classList.add("drop-target-before");
    } else {
        targetLi.classList.add("drop-target-after");
    }
    currentTargetLi = targetLi;
    currentDropPosition = position;
});

todolist.addEventListener("dragleave", (e) => {
    if (!todolist.contains(e.relatedTarget)) {
        clearDropIndicators();
        currentTargetLi = null;
        currentDropPosition = null;
    }
});

todolist.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!draggedElement) return;

    let fromIndex = draggedIndex;
    let toIndex = currentTargetLi ? parseInt(currentTargetLi.dataset.index, 10) : -1;
    let position = currentDropPosition;

    if (toIndex !== -1 && position && fromIndex !== -1) {
        executeReorder(fromIndex, toIndex, position);
    }

    cleanUpDrag();
});

todolist.addEventListener("dragend", () => {
    cleanUpDrag();
});

// Touch event handlers for mobile reordering
let touchStartX = 0;
let touchStartY = 0;
let touchDraggedLi = null;
let touchClone = null;
let isTouchDragging = false;
let touchOffsetX = 0;
let touchOffsetY = 0;

todolist.addEventListener("touchstart", (e) => {
    let li = e.target.closest("li");
    if (!li) return;
    if (e.target.closest("button, input")) return;

    let touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchDraggedLi = li;
    isTouchDragging = false;
}, { passive: true });

todolist.addEventListener("touchmove", (e) => {
    if (!touchDraggedLi) return;
    let touch = e.touches[0];
    let diffX = touch.clientX - touchStartX;
    let diffY = touch.clientY - touchStartY;

    if (!isTouchDragging) {
        if (Math.hypot(diffX, diffY) > 8) {
            isTouchDragging = true;
            let rect = touchDraggedLi.getBoundingClientRect();
            touchOffsetX = touch.clientX - rect.left;
            touchOffsetY = touch.clientY - rect.top;

            touchClone = touchDraggedLi.cloneNode(true);
            touchClone.classList.add("touch-drag-clone");
            touchClone.style.width = `${rect.width}px`;
            touchClone.style.height = `${rect.height}px`;
            touchClone.style.left = `${touch.clientX - touchOffsetX}px`;
            touchClone.style.top = `${touch.clientY - touchOffsetY}px`;
            document.body.appendChild(touchClone);

            touchDraggedLi.classList.add("dragging");
            touchDraggedLi.setAttribute("aria-grabbed", "true");
            draggedElement = touchDraggedLi;
            draggedIndex = parseInt(touchDraggedLi.dataset.index, 10);
        }
    }

    if (isTouchDragging) {
        if (e.cancelable) e.preventDefault();

        if (touchClone) {
            touchClone.style.left = `${touch.clientX - touchOffsetX}px`;
            touchClone.style.top = `${touch.clientY - touchOffsetY}px`;
        }

        let elem = document.elementFromPoint(touch.clientX, touch.clientY);
        let targetLi = elem ? elem.closest("#todo-container ul li") : null;

        clearDropIndicators();

        if (targetLi && targetLi !== touchDraggedLi) {
            let rect = targetLi.getBoundingClientRect();
            let isVertical = window.innerWidth <= 600 || (Math.abs(touch.clientY - (rect.top + rect.height / 2)) / rect.height > Math.abs(touch.clientX - (rect.left + rect.width / 2)) / rect.width);
            let position;
            if (isVertical) {
                position = (touch.clientY < rect.top + rect.height / 2) ? "before" : "after";
            } else {
                position = (touch.clientX < rect.left + rect.width / 2) ? "before" : "after";
            }

            if (position === "before") {
                targetLi.classList.add("drop-target-before");
            } else {
                targetLi.classList.add("drop-target-after");
            }
            currentTargetLi = targetLi;
            currentDropPosition = position;
        } else {
            currentTargetLi = null;
            currentDropPosition = null;
        }
    }
}, { passive: false });

todolist.addEventListener("touchend", (e) => {
    if (isTouchDragging) {
        if (e.cancelable) e.preventDefault();

        let fromIndex = draggedIndex;
        let toIndex = currentTargetLi ? parseInt(currentTargetLi.dataset.index, 10) : -1;
        let position = currentDropPosition;

        if (toIndex !== -1 && position && fromIndex !== -1) {
            executeReorder(fromIndex, toIndex, position);
        }

        if (touchClone && touchClone.parentNode) {
            touchClone.parentNode.removeChild(touchClone);
        }
        touchClone = null;
        cleanUpDrag();
        touchDraggedLi = null;
        isTouchDragging = false;
    } else {
        touchDraggedLi = null;
    }
});

todolist.addEventListener("touchcancel", () => {
    if (touchClone && touchClone.parentNode) {
        touchClone.parentNode.removeChild(touchClone);
    }
    touchClone = null;
    cleanUpDrag();
    touchDraggedLi = null;
    isTouchDragging = false;
});

function handleUpdate(e) {
    if (hasJustDragged) {
        return;
    }

    // 1. Delete task
    if (e.target.classList.contains("delete-btn") || e.target.innerHTML === "Delete") {
        let index = e.target.dataset.index !== undefined ? parseInt(e.target.dataset.index, 10) : -1;
        if (index >= 0 && index < storedTodo.length) {
            storedTodo.splice(index, 1);
            localStorage.setItem("todos", JSON.stringify(storedTodo));
            if (editingIndex === index) {
                editingIndex = null;
                inputbox.value = "";
                addbtn.innerHTML = "Add";
            } else if (editingIndex !== null && editingIndex > index) {
                editingIndex--;
            }
            displayTodo();
        }
        return;
    }

    // 2. Edit task
    if (e.target.classList.contains("edit-btn") || e.target.innerHTML === "Edit") {
        let index = e.target.dataset.index !== undefined ? parseInt(e.target.dataset.index, 10) : -1;
        if (index >= 0 && index < storedTodo.length) {
            editingIndex = index;
            inputbox.value = storedTodo[index].text;
            addbtn.innerHTML = "Save";
            inputbox.focus();
        }
        return;
    }

    // 3. Checkbox click
    if (e.target.classList.contains("task-checkbox")) {
        let taskDiv = e.target.closest(".task");
        let index = taskDiv ? parseInt(taskDiv.dataset.index, 10) : -1;
        if (index >= 0 && index < storedTodo.length) {
            storedTodo[index].completed = e.target.checked;
            localStorage.setItem("todos", JSON.stringify(storedTodo));
            displayTodo();
        }
        return;
    }

    // 4. Click on task text or task container
    if (e.target.classList.contains("task-text") || e.target.classList.contains("task")) {
        let taskDiv = e.target.closest(".task");
        let index = taskDiv ? parseInt(taskDiv.dataset.index, 10) : -1;
        if (index >= 0 && index < storedTodo.length) {
            storedTodo[index].completed = !storedTodo[index].completed;
            localStorage.setItem("todos", JSON.stringify(storedTodo));
            displayTodo();
        }
        return;
    }
}

addbtn.addEventListener("click", handleAddtask);
todolist.addEventListener("click", handleUpdate);
if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener("click", handleClearCompleted);
}
inputbox.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleAddtask();
    }
});

// function handleAddTask(){
//     if(inputBox.value.trim().length>0){
//         let inputBoxValue=inputBox.value.trim();
//         if(addBtn.innerHTML="Save"){
//             syntheticE.target.parentElement.previousElementSibling.innerHTML=inputBoxValue;
//             addBtn.innerHTML="Add";
//         }else{
//         let list=document.createElement("li");
//         list.innerHTML=`
//         <p class="task">${inputBoxValue}</p>
//                 <div class="btn-container">
//                 <button class="edit-btn">Edit</button>
//                 <button class="delete-btn">Delete</button>
//                 </div>
//         `;
//         todolist.append(list);
//         }
//     }
//     inputBox.value="";
// }

// function handleUpdate(e){
//     if(e.target.innerHTML == "Delete"){
//         e.target.parentElement.parentElement.remove();
//     }else if(e.target.innerHTML=="Edit"){
//         inputBox.value=e.target.parentElement.previousElementSibling.innerHTML;
//         addBtn.innerHTML="Save"
//         syntheticE=e;
//     }
// }

// addBtn.addEventListener("click",handleAddTask)
// addBtn.addEventListener("click",handleUpdate);