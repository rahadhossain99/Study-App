document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const routineToggleHeader = document.getElementById('routineToggleHeader');
    const routineToggleIcon = routineToggleHeader ? routineToggleHeader.querySelector('i') : null;
    const routineTableContainer = document.getElementById('routineTableContainer');
    const routineTable = document.getElementById('routineTable'); // Get the table element
    const routineTableBody = document.querySelector('#routineTable tbody');
    const saveRoutineBtn = document.getElementById('saveRoutineBtn');
    const printRoutineBtn = document.getElementById('printRoutineBtn');
    const toggleRoutineLayoutBtn = document.getElementById('toggleRoutineLayoutBtn'); // New button

    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const taskSubjectSelect = document.getElementById('taskSubject');
    const taskTimeInput = document.getElementById('taskTime');
    const taskList = document.getElementById('taskList');
    const taskInputFormContainer = document.querySelector('.task-input-form-container');


    const prevDayBtn = document.getElementById('prevDayBtn');
    const nextDayBtn = document.getElementById('nextDayBtn');
    const dateInput = document.getElementById('dateInput');

    const summaryCurrentDateSpan = document.getElementById('summaryCurrentDate');
    const summaryRoutineSubjectsSpan = document.getElementById('summaryRoutineSubjects');
    const currentTimeDisplaySpan = document.getElementById('currentTimeDisplay');

    const modeToggleBtn = document.getElementById('modeToggleBtn');
    const body = document.body;

    // --- State Variables ---
    let currentSelectedDate = new Date();
    let routineData = {};
    let dailyTasks = {};
    let currentMode = localStorage.getItem('studyPlannerMode') || 'edit';
    let routineTableCollapsed = localStorage.getItem('routineTableCollapsed');
    routineTableCollapsed = (routineTableCollapsed === 'true'); // Convert stored string to boolean

    // New state for routine table layout
    let routineLayoutMode = localStorage.getItem('routineLayoutMode') || 'table'; // 'table' or 'card'


    // --- Constants ---
    const daysInBangla = ["শনিবার", "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার"];
    const defaultRoutine = {
        "শনিবার": ["গণিত", "পদার্থবিজ্ঞান", "বাংলা প্রথম পত্র", "ইংরেজি প্রথম পত্র"],
        "রবিবার": ["রসায়ন", "জীববিজ্ঞান", "বাংলা দ্বিতীয় পত্র", "ইংরেজি দ্বিতীয় পত্র"],
        "সোমবার": ["উচ্চতর গণিত", "আইসিটি", "পদার্থবিজ্ঞান (রিভিশন)", "রসায়ন (রিভিশন)"],
        "মঙ্গলবার": ["গণিত (অনুশীলন)", "জীববিজ্ঞান (অনুশীলন)", "সাধারণ জ্ঞান", "মডেল টেস্ট"],
        "বুধবার": ["বাংলা", "ইংরেজি", "পদার্থবিজ্ঞান", "রসায়ন"],
        "বৃহস্পতিবার": ["আইসিটি (ব্যবহারিক)", "উচ্চতর গণিত (অনুশীলন)", "সৃজনশীল লেখা", "বিগত বছরের প্রশ্ন"],
        "শুক্রবার": ["সাপ্তাহিক পরীক্ষা", "ভুল বিশ্লেষণ", "পরবর্তী সপ্তাহের পরিকল্পনা", "বিশ্রাম"]
    };
    const LOCAL_STORAGE_ROUTINE_KEY = 'studyRoutine';
    const LOCAL_STORAGE_TASKS_KEY = 'dailyTasks';
    const LOCAL_STORAGE_MODE_KEY = 'studyPlannerMode';
    const LOCAL_STORAGE_ROUTINE_COLLAPSED_KEY = 'routineTableCollapsed';
    const LOCAL_STORAGE_ROUTINE_LAYOUT_KEY = 'routineLayoutMode'; // New Local Storage Key


    // --- Helper Functions ---

    function getBanglaDayName(date) {
        const jsDay = date.getDay();
        const jsDayMapToBnIndex = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0 };
        return daysInBangla[jsDayMapToBnIndex[jsDay]];
    }

    function formatDateToISO(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDateForInput(date) {
         const year = date.getFullYear();
         const month = (date.getMonth() + 1).toString().padStart(2, '0');
         const day = date.getDate().toString().padStart(2, '0');
         return `${year}-${month}-${day}`;
     }

    // Updated formatTimeForDisplay to handle 12-hour with AM/PM
    function formatTimeForDisplay(timeString) {
         if (!timeString || timeString.trim() === '') return '';
         try {
             const [hours, minutes] = timeString.split(':').map(Number);
             if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                 console.error("Invalid time format:", timeString);
                 return timeString;
             }
             const ampm = hours >= 12 ? 'PM' : 'AM';
             const displayHours = hours % 12 || 12; // 0 (midnight) and 12 (noon) become 12
             return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
         } catch (error) {
             console.error("Error formatting time:", timeString, error);
             return timeString;
         }
     }

     function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }


    // --- Routine Functions ---

    function loadRoutine() {
        try {
            const savedRoutine = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ROUTINE_KEY));
            if (savedRoutine && typeof savedRoutine === 'object') {
                routineData = {};
                daysInBangla.forEach(day => {
                    const savedSubjects = Array.isArray(savedRoutine[day]) ? savedRoutine[day] : (defaultRoutine[day] || []);
                    routineData[day] = savedSubjects.slice(0, 4);
                     while (routineData[day].length < 4) {
                          routineData[day].push("");
                     }
                });
                 const hasSavedData = Object.values(routineData).some(subjects => subjects.some(s => s && s.trim() !== ''));
                 if (!hasSavedData && Object.keys(savedRoutine).length > 0) {
                      console.warn("Loaded routine data was empty or invalid, using default routine.");
                      routineData = JSON.parse(JSON.stringify(defaultRoutine));
                 } else if (!hasSavedData && Object.keys(savedRoutine).length === 0) {
                      console.log("No routine data found in localStorage, using default routine.");
                      routineData = JSON.parse(JSON.stringify(defaultRoutine));
                 }

            } else {
                console.log("No routine data found in localStorage, using default routine.");
                routineData = JSON.parse(JSON.stringify(defaultRoutine));
            }
        } catch (e) {
             console.error("Failed to load routine from localStorage:", e);
             console.log("Using default routine due to loading error.");
             routineData = JSON.parse(JSON.stringify(defaultRoutine));
        }
        renderRoutineTable(); // Render table first
        applyRoutineCollapsedState(); // Apply collapse state
        setRoutineLayoutMode(routineLayoutMode); // Apply layout state
    }

    function saveRoutine() {
        try {
            localStorage.setItem(LOCAL_STORAGE_ROUTINE_KEY, JSON.stringify(routineData));
            alert('রুটিন সফলভাবে সংরক্ষণ করা হয়েছে!');
            populateSubjectSelectForDay(currentSelectedDate);
            updateDailySummary(currentSelectedDate);
        } catch (e) {
            console.error("Failed to save routine to localStorage:", e);
            alert('রুটিন সংরক্ষণ করতে সমস্যা হয়েছে।');
        }
    }

    function renderRoutineTable() {
         if (!routineTableBody) return;
        routineTableBody.innerHTML = '';
        daysInBangla.forEach(day => {
            const subjects = routineData[day] || ["", "", "", ""];
            while(subjects.length < 4) subjects.push("");

            const row = routineTableBody.insertRow();

            const dayCell = row.insertCell();
            dayCell.textContent = day;
            dayCell.setAttribute('data-label', 'বার');
            dayCell.contentEditable = 'false';

            subjects.forEach((subject, index) => {
                const cell = row.insertCell();
                cell.textContent = subject;
                cell.setAttribute('data-label', `বিষয় ${index + 1}`);
                cell.setAttribute('data-day', day);
                cell.setAttribute('data-subject-index', index);
                 // Event listeners added conditionally in applyModeToRoutineTable
            });
        });
        applyModeToRoutineTable(); // Apply contenteditable based on current mode
        applyRoutineLayoutStyles(); // Apply layout specific styles
    }

    function handleRoutineCellBlur(event) {
         if (currentMode === 'edit') {
             const cell = event.target;
             const day = cell.getAttribute('data-day');
             const index = parseInt(cell.getAttribute('data-subject-index'), 10);
             const newValue = cell.textContent.trim();

             if (routineData[day] && routineData[day][index] !== newValue) {
                 updateRoutineData(day, index, newValue);
             }
         }
     }

    function handleRoutineCellKeyPress(event) {
         if (currentMode === 'edit' && event.key === 'Enter') {
             event.preventDefault();
             event.target.blur();
         }
     }

    function updateRoutineData(day, subjectIndex, newValue) {
         const dayKey = daysInBangla.find(d => d === day);
         if (dayKey && routineData[dayKey] && routineData[dayKey].length > subjectIndex) {
             routineData[dayKey][subjectIndex] = newValue;
             console.log(`Routine data staged for ${day}, subject ${subjectIndex}: ${newValue}`);
         }
    }

    function toggleRoutineTable() {
         if (!routineTableContainer || !routineToggleHeader || !routineToggleIcon) return;
         routineTableCollapsed = !routineTableCollapsed;
         applyRoutineCollapsedState();
         localStorage.setItem(LOCAL_STORAGE_ROUTINE_COLLAPSED_KEY, routineTableCollapsed);
     }

    function applyRoutineCollapsedState() {
         if (!routineTableContainer || !routineToggleHeader || !routineToggleIcon) return;

         if (routineTableCollapsed) {
             routineTableContainer.classList.add('collapsed');
             routineToggleHeader.classList.add('collapsed');
             routineToggleIcon.classList.replace('fa-chevron-up', 'fa-chevron-down');
         } else {
             // Small timeout before removing 'collapsed' class to ensure transition plays
             setTimeout(() => {
                 routineTableContainer.classList.remove('collapsed');
             }, 50); // Match or slightly less than CSS transition time
             routineToggleHeader.classList.remove('collapsed');
             routineToggleIcon.classList.replace('fa-chevron-down', 'fa-chevron-up');
         }
     }

     // New function to set the routine table layout mode
     function setRoutineLayoutMode(mode) {
         if (!routineTableContainer || !toggleRoutineLayoutBtn) return;
         if (mode !== 'table' && mode !== 'card') {
             console.error("Invalid routine layout mode:", mode);
             mode = 'table'; // Default to table if invalid
         }

         routineLayoutMode = mode;
         localStorage.setItem(LOCAL_STORAGE_ROUTINE_LAYOUT_KEY, routineLayoutMode);

         applyRoutineLayoutStyles(); // Apply CSS classes

         // Update toggle button text and icon
         if (routineLayoutMode === 'card') {
             toggleRoutineLayoutBtn.innerHTML = '<i class="fas fa-table"></i> টেবিল ভিউ';
             toggleRoutineLayoutBtn.title = "সাপ্তাহিক রুটিন টেবিল আকারে দেখুন";
         } else { // mode is 'table'
             toggleRoutineLayoutBtn.innerHTML = '<i class="fas fa-list"></i> কার্ড ভিউ';
             toggleRoutineLayoutBtn.title = "সাপ্তাহিক রুটিন কার্ড আকারে দেখুন";
         }
         console.log(`Routine layout mode set to: ${routineLayoutMode}`);
     }

     // New function to apply CSS classes based on routine layout mode
     function applyRoutineLayoutStyles() {
         if (!routineTableContainer) return;
         if (routineLayoutMode === 'card') {
             routineTableContainer.classList.add('is-card-layout');
         } else {
             routineTableContainer.classList.remove('is-card-layout');
         }
          // Re-apply contenteditable state as CSS might override pointer-events
          applyModeToRoutineTable();
     }

     // New function to toggle routine layout mode
     function toggleRoutineLayout() {
         setRoutineLayoutMode(routineLayoutMode === 'table' ? 'card' : 'table');
     }


    function populateSubjectSelectForDay(date) {
        if (!taskSubjectSelect) return;
        const dayName = getBanglaDayName(date);
        taskSubjectSelect.innerHTML = '<option value="">বিষয় নির্বাচন করুন</option>';

        if (dayName && routineData[dayName]) {
            const subjectsForDay = routineData[dayName];
            const uniqueRoutineSubjects = [...new Set(subjectsForDay.filter(s => s && s.trim() !== ""))];

            if (uniqueRoutineSubjects.length > 0) {
                uniqueRoutineSubjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject;
                    option.textContent = subject;
                    taskSubjectSelect.appendChild(option);
                });
            }
        }
        const otherOption = document.createElement('option');
        otherOption.value = "অন্যান্য";
        otherOption.textContent = "অন্যান্য বিষয়...";
        taskSubjectSelect.appendChild(otherOption);
    }

    // --- Daily Task Functions ---

    function loadDailyTasks() {
        try {
            const savedTasks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TASKS_KEY));
            dailyTasks = savedTasks || {};
            for(const dateKey in dailyTasks) {
                 if (Array.isArray(dailyTasks[dateKey])) {
                      dailyTasks[dateKey] = dailyTasks[dateKey].map(task => ({
                           ...task,
                           id: typeof task.id === 'number' ? task.id : parseFloat(task.id || 0)
                      }));
                 } else {
                      dailyTasks[dateKey] = [];
                 }
            }
        } catch (e) {
            console.error("Failed to load daily tasks from localStorage:", e);
            dailyTasks = {};
        }
    }

    function saveDailyTasks() {
        try {
            localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(dailyTasks));
        } catch (e) {
            console.error("Failed to save daily tasks to localStorage:", e);
        }
    }

    function loadTasksForDate(dateKey) {
        if (!taskList) return;
        taskList.innerHTML = '';
        const tasksForDay = dailyTasks[dateKey] || [];

        tasksForDay.sort((a, b) => {
             const aCompleted = a.completed === true;
             const bCompleted = b.completed === true;
             if (aCompleted !== bCompleted) return aCompleted - bCompleted;

             const aTime = a.time || '';
             const bTime = b.time || '';

             if (aTime && bTime) {
                 return aTime.localeCompare(bTime);
             }
             if (aTime) return -1;
             if (bTime) return 1;

             return (a.id || 0) - (b.id || 0);
         });


        if (tasksForDay.length === 0) {
            const li = document.createElement('li');
            li.classList.add('no-tasks');
            li.innerHTML = (currentMode === 'edit')
                ? 'এই দিনের জন্য কোনো কাজ নেই। <br>উপরের ফর্ম ব্যবহার করে নতুন কাজ যোগ করুন!'
                : 'এই দিনের জন্য কোনো কাজ নেই।';
            taskList.appendChild(li);
            applyModeToTaskList();
            highlightCurrentTask();
            return;
        }

        let animationDelay = 0;
        tasksForDay.forEach(task => {
            addTaskToDOM(task, dateKey, animationDelay);
            animationDelay += 0.05;
        });

        applyModeToTaskList();
        highlightCurrentTask();
    }

    function addTaskToDOM(task, dateKey, animationDelay = 0) {
        if (!taskList) return;

        const noTaskLi = taskList.querySelector('li.no-tasks');
        if (noTaskLi) {
            taskList.innerHTML = '';
        }

        const li = document.createElement('li');
        li.dataset.taskId = task.id;
        li.dataset.dateKey = dateKey;
        li.style.animationDelay = `${animationDelay}s`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed === true;
        checkbox.title = task.completed ? "অসম্পন্ন হিসেবে চিহ্নিত করুন" : "সম্পন্ন হিসেবে চিহ্নিত করুন";
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id, dateKey));

        const taskContentDiv = document.createElement('div');
        taskContentDiv.classList.add('task-content');

        const subjectSpan = document.createElement('span');
        subjectSpan.classList.add('task-subject');
        subjectSpan.textContent = escapeHTML(task.subject || 'বিষয় নেই');
        subjectSpan.dataset.field = 'subject';
        subjectSpan.title = "বিষয় (এডিট করতে ক্লিক করুন)";
        // Listeners added conditionally in applyModeToTaskList


        const timeSpan = document.createElement('span');
        timeSpan.classList.add('task-time');
        const formattedTime = formatTimeForDisplay(task.time); // Use the formatted time
        if (formattedTime) {
             timeSpan.textContent = formattedTime;
             timeSpan.style.display = 'inline-block';
             timeSpan.title = `সময়: ${formattedTime}`;
        } else {
             timeSpan.textContent = '';
             timeSpan.style.display = 'none';
        }


        const textSpan = document.createElement('span');
        textSpan.classList.add('task-text');
        textSpan.textContent = escapeHTML(task.text || 'কাজের বিবরণ নেই');
        textSpan.dataset.field = 'text';
        textSpan.title = "কাজের বিবরণ (এডিট করতে ক্লিক করুন)";
        // Listeners added conditionally in applyModeToTaskList


        if (task.completed) {
            li.classList.add('completed');
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-task');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.title = "কাজটি মুছে ফেলুন";
        deleteBtn.addEventListener('click', () => deleteTask(task.id, dateKey));

        li.appendChild(checkbox);
        taskContentDiv.appendChild(subjectSpan);
        taskContentDiv.appendChild(timeSpan);
        taskContentDiv.appendChild(textSpan);
        li.appendChild(taskContentDiv);
        li.appendChild(deleteBtn);

        taskList.appendChild(li);
    }

    function handleTaskContentBlur(event) {
         if (currentMode === 'edit') {
             const span = event.target;
             const li = span.closest('li');
             if (!li) return;

             const taskId = parseFloat(li.dataset.taskId);
             const dateKey = li.dataset.dateKey;
             const field = span.dataset.field;
             const newValue = span.textContent.trim();

             const tasksForDay = dailyTasks[dateKey];
             if (!tasksForDay) return;

             const task = tasksForDay.find(t => t.id === taskId);

             if (task) {
                 if (field === 'text' && newValue === '') {
                      alert('কাজের বিবরণ খালি রাখা যাবে না।');
                      span.textContent = escapeHTML(task.text || 'পাঠ্য/কাজ লিখুন...');
                       setTimeout(() => {
                           const range = document.createRange();
                           const sel = window.getSelection();
                            if(span.firstChild && sel) {
                                range.setStart(span.firstChild, span.firstChild.length);
                                range.collapse(true);
                                sel.removeAllRanges();
                                sel.addRange(range);
                            } else {
                                 span.focus();
                            }
                       }, 0);

                      return;
                 }

                 if (task[field] !== newValue) {
                     updateTaskContent(taskId, dateKey, field, newValue);
                 }
             }
         }
     }

    function handleTaskContentKeyPress(event) {
         if (currentMode === 'edit' && event.key === 'Enter') {
             event.preventDefault();
             event.target.blur();
         }
     }


    function updateTaskContent(taskId, dateKey, field, newValue) {
         const tasksForDay = dailyTasks[dateKey];
         if (!tasksForDay) return;

         const taskIndex = tasksForDay.findIndex(t => t.id === taskId);
         if (taskIndex > -1) {
             tasksForDay[taskIndex][field] = newValue;
             saveDailyTasks();
             console.log(`Task ${taskId} field "${field}" updated to "${newValue}".`);
             loadTasksForDate(dateKey);
         }
    }

    function toggleTaskCompletion(taskId, dateKey) {
        const tasksForDay = dailyTasks[dateKey];
        if (!tasksForDay) return;
        const taskIndex = tasksForDay.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            tasksForDay[taskIndex].completed = !tasksForDay[taskIndex].completed;
            saveDailyTasks();
            loadTasksForDate(dateKey);
            console.log(`Task ${taskId} completion toggled.`);
        }
    }

    function deleteTask(taskId, dateKey) {
        if (!taskList || !dailyTasks[dateKey]) return;

        if (confirm('আপনি কি নিশ্চিতভাবে এই কাজটি মুছে ফেলতে চান?')) {
            dailyTasks[dateKey] = (dailyTasks[dateKey] || []).filter(t => t.id !== taskId);

             if (dailyTasks[dateKey].length === 0) {
                 delete dailyTasks[dateKey];
             }

            saveDailyTasks();
            loadTasksForDate(dateKey);
            console.log(`Task ${taskId} deleted.`);
        }
    }

    // --- Date Navigation & Display Functions ---

    function displayDate() {
        currentSelectedDate.setHours(0, 0, 0, 0);
        updateDailySummary(currentSelectedDate);
        loadTasksForDate(formatDateToISO(currentSelectedDate));
        populateSubjectSelectForDay(currentSelectedDate);
         dateInput.value = formatDateForInput(currentSelectedDate);
    }

    function changeDate(days) {
        currentSelectedDate.setDate(currentSelectedDate.getDate() + days);
        displayDate();
    }

    function updateDailySummary(date) {
         if (!summaryCurrentDateSpan || !summaryRoutineSubjectsSpan || !dateInput) return;

         const dayName = getBanglaDayName(date);
         const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
         const formattedDate = date.toLocaleDateString('bn-BD', options);
         summaryCurrentDateSpan.textContent = formattedDate;

         let subjectsText = "আজকের রুটিনে কোনো বিষয় যোগ করা হয়নি";
         if (dayName && routineData[dayName]) {
             const subjectsForDay = routineData[dayName];
             const nonEmptySubjects = subjectsForDay.filter(s => s && s.trim() !== "");
             if (nonEmptySubjects.length > 0) {
                 subjectsText = nonEmptySubjects.join(' | ');
             }
         } else {
              subjectsText = "এই বারের জন্য কোনো রুটিন পাওয়া যায়নি";
         }
         summaryRoutineSubjectsSpan.textContent = subjectsText; // Update the separate span
     }

    // Updated updateCurrentTime to use formatTimeForDisplay
    function updateCurrentTime() {
         if (!currentTimeDisplaySpan) return;
         const now = new Date();
         const hours = now.getHours().toString().padStart(2, '0');
         const minutes = now.getMinutes().toString().padStart(2, '0');
         // Seconds are not needed for this format, but keeping for display if wanted
         // const seconds = now.getSeconds().toString().padStart(2, '0');

         const timeString24 = `${hours}:${minutes}`; // Get time in HH:MM format
         const formattedTime = formatTimeForDisplay(timeString24); // Format it to 12-hour AM/PM

         // Append seconds if needed, though the design implies HH:MM AM/PM
         // currentTimeDisplaySpan.textContent = `${formattedTime}:${seconds}`; // If you want seconds
         currentTimeDisplaySpan.textContent = formattedTime; // Just HH:MM AM/PM

     }

    function highlightCurrentTask() {
         if (!taskList) return;

          taskList.querySelectorAll('li.highlight').forEach(li => li.classList.remove('highlight'));

          const dateKey = formatDateToISO(currentSelectedDate);
          const tasksForDay = dailyTasks[dateKey] || [];

          const incompleteTasksWithTime = tasksForDay.filter(task =>
              !task.completed && task.time && /^\d{2}:\d{2}$/.test(task.time.trim())
          );

          if (incompleteTasksWithTime.length === 0) return;

          incompleteTasksWithTime.sort((a, b) => a.time.localeCompare(b.time));

          const now = new Date();
          const currentHHMM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

          let taskToHighlight = null;

           for (let i = incompleteTasksWithTime.length - 1; i >= 0; i--) {
                if (incompleteTasksWithTime[i].time <= currentHHMM) {
                     taskToHighlight = incompleteTasksWithTime[i];
                     break;
                }
           }

           if (!taskToHighlight && incompleteTasksWithTime.length > 0) {
               taskToHighlight = incompleteTasksWithTime[0];
           }


          if (taskToHighlight) {
              const li = taskList.querySelector(`li[data-task-id="${taskToHighlight.id}"]`);
              if (li && !li.classList.contains('completed')) {
                  li.classList.add('highlight');
                  console.log(`Highlighted task: ${taskToHighlight.text}`);
              } else if (li && li.classList.contains('completed')) {
                   console.log(`Task ${taskToHighlight.text} is completed, not highlighting.`);
              }
          } else {
               console.log("No tasks to highlight for current time.");
          }
     }


    // --- View/Edit Mode Functions ---

    function setMode(mode) {
        if (!body) return;
        currentMode = mode;
        localStorage.setItem(LOCAL_STORAGE_MODE_KEY, mode);

        if (currentMode === 'view') {
            body.classList.add('view-mode');
        } else {
            body.classList.remove('view-mode');
        }

        applyModeStyles();
        updateModeToggleButton();
        console.log(`App mode set to: ${currentMode}`);
    }

    function toggleMode() {
        setMode(currentMode === 'edit' ? 'view' : 'edit');
    }

    function applyModeStyles() {
        applyModeToRoutineTable();
        applyModeToTaskList();
    }

    function applyModeToRoutineTable() {
         if (!routineTableBody) return;

        const routineCells = routineTableBody.querySelectorAll('td');
        routineCells.forEach(cell => {
            if (cell.cellIndex > 0) { // Only make cells editable if it's not the day column
                 cell.contentEditable = (currentMode === 'edit').toString();

                 // Remove existing listeners to prevent duplicates
                 cell.removeEventListener('blur', handleRoutineCellBlur);
                 cell.removeEventListener('keypress', handleRoutineCellKeyPress);

                 if (currentMode === 'edit') {
                     cell.style.cursor = 'text';
                     cell.removeAttribute('tabindex');
                     cell.style.pointerEvents = 'auto';
                     // Add listeners only in edit mode
                     cell.addEventListener('blur', handleRoutineCellBlur);
                     cell.addEventListener('keypress', handleRoutineCellKeyPress);
                 } else {
                     cell.style.cursor = 'default';
                     cell.setAttribute('tabindex', -1);
                     cell.style.pointerEvents = 'none';
                 }
            }
        });

         if (saveRoutineBtn) {
             saveRoutineBtn.style.display = (currentMode === 'edit') ? 'inline-flex' : 'none';
         }
    }

    function applyModeToTaskList() {
         if (!taskList || !taskInputFormContainer) return;

         taskInputFormContainer.style.display = (currentMode === 'edit') ? 'flex' : 'none';

         const taskItems = taskList.querySelectorAll('li:not(.no-tasks)');
         taskItems.forEach(li => {
             const checkbox = li.querySelector('input[type="checkbox"]');
             const taskSubjectSpan = li.querySelector('.task-subject');
             const taskTextSpan = li.querySelector('.task-text');
             const deleteButton = li.querySelector('.delete-task');

             const editableSpans = [taskSubjectSpan, taskTextSpan].filter(span => span);

             editableSpans.forEach(span => {
                 // Remove existing listeners to prevent duplicates
                 span.removeEventListener('blur', handleTaskContentBlur);
                 span.removeEventListener('keypress', handleTaskContentKeyPress);
             });


             if (currentMode === 'view') {
                 if (checkbox) {
                      checkbox.disabled = false;
                      checkbox.style.cursor = 'pointer';
                      checkbox.setAttribute('tabindex', 0);
                      checkbox.style.pointerEvents = 'auto';
                 }
                 editableSpans.forEach(span => {
                    if (span) {
                        span.contentEditable = 'false';
                        span.style.cursor = 'default';
                        span.setAttribute('tabindex', -1);
                        span.style.pointerEvents = 'none';
                    }
                 });
                 if (deleteButton) deleteButton.style.display = 'none';

             } else { // Edit mode
                 if (checkbox) {
                     checkbox.disabled = false;
                     checkbox.style.cursor = 'pointer';
                      checkbox.setAttribute('tabindex', 0);
                     checkbox.style.pointerEvents = 'auto';
                 }
                 editableSpans.forEach(span => {
                    if(span){
                        span.contentEditable = 'true';
                        span.style.cursor = 'text';
                        span.removeAttribute('tabindex');
                        span.style.pointerEvents = 'auto';
                        // Add listeners only in edit mode
                        span.addEventListener('blur', handleTaskContentBlur);
                        span.addEventListener('keypress', handleTaskContentKeyPress);
                    }
                 });
                 if (deleteButton) deleteButton.style.display = 'inline-flex';
             }
         });

          const noTaskLi = taskList.querySelector('li.no-tasks');
          if (noTaskLi) {
              noTaskLi.innerHTML = (currentMode === 'edit')
                  ? 'এই দিনের জন্য কোনো কাজ নেই। <br>উপরের ফর্ম ব্যবহার করে নতুন কাজ যোগ করুন!'
                  : 'এই দিনের জন্য কোনো কাজ নেই।';
          }

          highlightCurrentTask();
     }


    function updateModeToggleButton() {
         if (!modeToggleBtn) return;

         if (currentMode === 'view') {
             modeToggleBtn.innerHTML = '<i class="fas fa-edit"></i> এডিট মোড';
             modeToggleBtn.title = "রুটিন ও টাস্ক এডিট করার জন্য";
         } else {
             modeToggleBtn.innerHTML = '<i class="fas fa-eye"></i> ভিউ মোড';
             modeToggleBtn.title = "শুধুমাত্র রুটিন ও টাস্ক দেখার জন্য";
         }
     }

    // --- Print Routine Function ---
    function printRoutine() {
         if (!routineTableContainer || !routineToggleHeader) return;

        // Store current states
        const wasCollapsed = routineTableContainer.classList.contains('collapsed');
        const wasCardLayout = routineTableContainer.classList.contains('is-card-layout');

        // Temporarily set to visible table layout for printing
        routineTableContainer.classList.remove('collapsed', 'is-card-layout');
        if(routineToggleHeader) routineToggleHeader.classList.remove('collapsed');


        // Small delay to allow DOM update before printing
        setTimeout(() => {
             window.print();

             // Restore original states after printing
             // A slightly longer timeout might be needed depending on browser print dialog behavior
             setTimeout(() => {
                  if (wasCollapsed) routineTableContainer.classList.add('collapsed');
                  if (wasCardLayout) routineTableContainer.classList.add('is-card-layout');
                  if (wasCollapsed && routineToggleHeader) routineToggleHeader.classList.add('collapsed');
             }, 100); // Increased delay slightly
        }, 50);
    }


    // --- Initialization ---

    function initializeApp() {
        loadRoutine();
        loadDailyTasks();
        displayDate();
        setMode(currentMode); // Apply initial mode (includes applying layout styles)

        updateCurrentTime();
        highlightCurrentTask();
        setInterval(updateCurrentTime, 1000);
        setInterval(highlightCurrentTask, 60 * 1000);

        setupEventListeners();

        console.log("স্মার্ট স্টাডি প্ল্যানার (উন্নত ডিজাইন) সফলভাবে লোড হয়েছে!");
    }

    // --- Event Listeners Setup ---

    function setupEventListeners() {
        if(saveRoutineBtn) saveRoutineBtn.addEventListener('click', saveRoutine);
        if(printRoutineBtn) printRoutineBtn.addEventListener('click', printRoutine);
        if(toggleRoutineLayoutBtn) toggleRoutineLayoutBtn.addEventListener('click', toggleRoutineLayout); // Add listener for new button
        if(routineToggleHeader) routineToggleHeader.addEventListener('click', toggleRoutineTable);

        if(prevDayBtn) prevDayBtn.addEventListener('click', () => changeDate(-1));
        if(nextDayBtn) nextDayBtn.addEventListener('click', () => changeDate(1));

        if(dateInput) dateInput.addEventListener('change', (e) => {
            try {
                 const selectedDate = new Date(e.target.value);
                 if (!isNaN(selectedDate.getTime())) {
                     selectedDate.setHours(0, 0, 0, 0);
                     currentSelectedDate = selectedDate;
                     displayDate();
                 } else {
                     alert("অনুগ্রহ করে সঠিক তারিখ নির্বাচন করুন।");
                      dateInput.value = formatDateForInput(currentSelectedDate);
                 }
            } catch (error) {
                 console.error("Error handling date input change:", error);
                 alert("তারিখ প্রক্রিয়াকরণে সমস্যা হয়েছে।");
                  dateInput.value = formatDateForInput(currentSelectedDate);
            }
        });

        if(modeToggleBtn) modeToggleBtn.addEventListener('click', toggleMode);

        if(taskForm) taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (currentMode !== 'edit') {
                 alert('কাজ যোগ করার জন্য আপনাকে এডিট মোডে থাকতে হবে।');
                 return;
            }

            const taskText = taskInput.value.trim();
            let taskSubject = taskSubjectSelect.value;
            const taskTime = taskTimeInput.value;

            if (taskText === '') {
                alert('অনুগ্রহ করে কাজের বিবরণ লিখুন।');
                taskInput.focus();
                return;
            }
            if (taskSubject === '' || taskSubject === 'বিষয় নির্বাচন করুন') {
                 alert('অনুগ্রহ করে একটি বিষয় নির্বাচন করুন।');
                 taskSubjectSelect.focus();
                 return;
            }

            if (taskSubject === "অন্যান্য") {
                const customSubject = prompt("অনুগ্রহ করে আপনার বিষয়টির নাম লিখুন:", "");
                if (customSubject && customSubject.trim() !== "") {
                    taskSubject = customSubject.trim();
                     if (!taskSubjectSelect.querySelector(`option[value="${CSS.escape(taskSubject)}"]`)) {
                         const option = document.createElement('option');
                         option.value = taskSubject;
                         option.textContent = taskSubject;
                         taskSubjectSelect.insertBefore(option, taskSubjectSelect.lastChild);
                     }
                     taskSubjectSelect.value = taskSubject;
                } else {
                    alert("বিষয়ের নাম খালি রাখা যাবে না বা নির্বাচন বাতিল করা হয়েছে।");
                    taskSubjectSelect.value = '';
                    return;
                }
            }


            const dateKey = formatDateToISO(currentSelectedDate);
            if (!dailyTasks[dateKey]) {
                dailyTasks[dateKey] = [];
            }

            const newTask = {
                id: Date.now() + Math.random(),
                subject: taskSubject,
                time: taskTime,
                text: taskText,
                completed: false
            };

            dailyTasks[dateKey].push(newTask);
            saveDailyTasks();
            loadTasksForDate(dateKey);

            taskInput.value = '';
            taskTimeInput.value = '';
            taskSubjectSelect.value = '';
            taskInput.focus();

            console.log("New task added:", newTask);
        });

    }


    // --- Initial Call ---
    initializeApp();
});