'use strict';
// The four interactions are deliberately small and easy to explain in a video.
const message = document.getElementById('studyMessage');
const textButton = document.getElementById('textColorBtn');
const colorButton = document.getElementById('buttonColorBtn');
const alertButton = document.getElementById('alertBtn');
const tipButton = document.getElementById('tipBtn');
const tipPanel = document.getElementById('tipPanel');

const textColors = ['#b36b77', '#68866b', '#6e83a0', '#70645c'];
const buttonColors = ['#e0e9d5', '#f7dedc', '#f7eac2', '#dfe9ed'];
let textIndex = 0;
let buttonIndex = 0;

// 1. A click changes the motivational sentence color.
textButton.addEventListener('click', () => {
  message.style.color = textColors[textIndex];
  textIndex = (textIndex + 1) % textColors.length;
});

// 2. A click changes this button's own background.
colorButton.addEventListener('click', () => {
  colorButton.style.backgroundColor = buttonColors[buttonIndex];
  buttonIndex = (buttonIndex + 1) % buttonColors.length;
});

// 3. Hovering without clicking shows a native browser alert.
alertButton.addEventListener('mouseenter', () => {
  window.alert('étude says: one task at a time. You can do this! ♡');
});

// 4. A click reveals or hides a study tip.
tipButton.addEventListener('click', () => {
  const show = tipPanel.hidden;
  tipPanel.hidden = !show;
  tipButton.setAttribute('aria-expanded', String(show));
  tipButton.textContent = show ? '04 · hide the study tip' : '04 · show a study tip';
});


// Optional study tools. Data is saved only in this browser.
const taskList = document.getElementById('taskList');
const taskProgress = document.getElementById('taskProgress');
function readSaved(key, fallback) {
  try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); }
  catch { return fallback; }
}
function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function localDate() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
// Old personal tasks are imported into the same calendar storage once.
const planKey = 'etude-daily-plans-v3';
function createPlanRow(text, checked, onChange, onRemove, deadline=false) {
  const li=document.createElement('li'); if (checked) li.classList.add('done');
  const checkbox=document.createElement('input'); checkbox.type='checkbox'; checkbox.checked=checked;
  checkbox.setAttribute('aria-label', 'Complete '+text); checkbox.addEventListener('change',()=>onChange(checkbox.checked));
  const label=document.createElement('span'); label.textContent=text;
  if(deadline){ const tag=document.createElement('small'); tag.className='due-tag'; tag.textContent='Due Today'; label.append(' ',tag); }
  const remove=document.createElement('button'); remove.type='button'; remove.className='task-delete'; remove.textContent='×';
  remove.setAttribute('aria-label','Delete '+text); remove.addEventListener('click',onRemove);
  li.append(checkbox,label,remove); return li;
}
function renderTasks() {
  taskList.replaceChildren();
  const due = deadlines.filter(d => d.date === localDate());
  due.forEach(d => taskList.append(createPlanRow(d.title, !!d.done, checked => {
    d.done = checked; saveDeadlines(); renderCalendar();
  }, () => { deadlines = deadlines.filter(x => x.id !== d.id); saveDeadlines(); renderCalendar(); }, true)));
  taskProgress.textContent = `${due.filter(t => t.done).length} of ${due.length} done today`;
  if (!due.length) { const li = document.createElement('li'); li.textContent = 'A fresh page for today ♡'; taskList.append(li); }
}

// Timer uses actual end time so it remains accurate when the tab is inactive.
const timerDisplay = document.getElementById('timerDisplay');
const timerStart = document.getElementById('timerStart');
const timerReset = document.getElementById('timerReset');
const timerStatus = document.getElementById('timerStatus');
const breakDuration = document.getElementById('breakDuration');
const breakDurationValue = document.getElementById('breakDurationValue');
const focusMode = document.getElementById('focusMode');
const breakMode = document.getElementById('breakMode');
let mode = 'focus';
const focusDuration = document.getElementById('focusDuration');
const focusDurationValue = document.getElementById('focusDurationValue');
let selectedSeconds = 40 * 60;
let remainingSeconds = selectedSeconds;
let timerId = null;
let endTime = 0;
function showTime() {
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}
function stopTimer() { if (timerId !== null) clearInterval(timerId); timerId = null; timerStart.textContent = 'start ♡'; }
function tick() {
  remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000)); showTime();
  if (remainingSeconds === 0) { stopTimer(); timerStatus.textContent = mode === 'focus' ? 'focus complete! take a little break ♡' : 'break complete! welcome back ♡'; }
}
timerStart.addEventListener('click', () => {
  if (timerId !== null) { tick(); stopTimer(); timerStatus.textContent = 'paused'; return; }
  if (remainingSeconds === 0) remainingSeconds = selectedSeconds;
  endTime = Date.now() + remainingSeconds * 1000;
  timerId = setInterval(tick, 250); timerStart.textContent = 'pause'; timerStatus.textContent = 'you’ve got this ♡'; tick();
});
timerReset.addEventListener('click', () => { stopTimer(); remainingSeconds = selectedSeconds; showTime(); timerStatus.textContent = 'ready when you are'; });
function setMode(next) {
  stopTimer(); mode = next;
  focusMode.classList.toggle('active', mode === 'focus'); breakMode.classList.toggle('active', mode === 'break');
  focusMode.setAttribute('aria-pressed', String(mode === 'focus')); breakMode.setAttribute('aria-pressed', String(mode === 'break'));
  selectedSeconds = Number(mode === 'focus' ? focusDuration.value : breakDuration.value) * 60;
  remainingSeconds = selectedSeconds; showTime(); timerStatus.textContent = 'ready when you are';
}
focusMode.addEventListener('click', () => setMode('focus'));
breakMode.addEventListener('click', () => setMode('break'));
focusDuration.addEventListener('input', () => {
  focusDurationValue.textContent = `${focusDuration.value} min`;
  if (mode === 'focus') setMode('focus');
});
breakDuration.addEventListener('input', () => {
  breakDurationValue.textContent = `${breakDuration.value} min`;
  if (mode === 'break') setMode('break');
});
showTime();

// Dates are stored as local YYYY-MM-DD, avoiding UTC timezone shifts.
function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
const today = () => dateKey(new Date());
let deadlines = readSaved('etude-deadlines-v1', []);
if (!Array.isArray(deadlines)) deadlines = [];
// Migrate personal plans to calendar entries, avoiding duplicate items.
if (localStorage.getItem('etude-plan-merged-v1') !== 'yes') {
  const oldPlans = readSaved(planKey, []);
  if (Array.isArray(oldPlans)) {
    oldPlans.forEach(t => {
      if (t && t.text && t.date && !deadlines.some(d=>d.date===t.date && d.title===t.text))
        deadlines.push({id:makeId(), date:t.date, title:String(t.text), done:!!t.done});
    });
  }
  try { localStorage.setItem('etude-deadlines-v1', JSON.stringify(deadlines)); localStorage.setItem('etude-plan-merged-v1','yes'); } catch {}
}
const calendarMonth = document.getElementById('calendarMonth');
const calendarGrid = document.getElementById('calendarGrid');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const deadlineList = document.getElementById('deadlineList');
let selectedDate = today();
let visibleMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1);
function renderDeadlines() {
  selectedDateLabel.textContent = new Date(selectedDate+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'long',year:'numeric'});
  deadlineList.replaceChildren();
  deadlines.filter(d => d.date === selectedDate).forEach(d => {
    const li = document.createElement('li'); if(d.done) li.classList.add('done');
    const checkbox=document.createElement('input'); checkbox.type='checkbox'; checkbox.checked=!!d.done;
    checkbox.setAttribute('aria-label','Complete '+d.title); checkbox.addEventListener('change',()=>{d.done=checkbox.checked;saveDeadlines();renderCalendar();});
    const name = document.createElement('span'); name.textContent = d.title;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'task-delete'; remove.textContent = '×'; remove.setAttribute('aria-label','Delete '+d.title);
    remove.addEventListener('click', () => { deadlines = deadlines.filter(item => item.id !== d.id); saveDeadlines(); renderCalendar(); });
    li.append(checkbox,name,remove); deadlineList.append(li);
  });
  if (!deadlineList.children.length) { const li=document.createElement('li'); li.textContent='No deadlines for this day ♡'; deadlineList.append(li); }
}
function saveDeadlines() { try { localStorage.setItem('etude-deadlines-v1', JSON.stringify(deadlines)); } catch {} }
function renderCalendar() {
  calendarMonth.textContent = visibleMonth.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  calendarGrid.replaceChildren();
  const first = (visibleMonth.getDay()+6)%7;
  const count = new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,0).getDate();
  for (let i=0;i<first;i++) { const blank=document.createElement('span'); calendarGrid.append(blank); }
  for(let day=1;day<=count;day++) {
    const key=dateKey(new Date(visibleMonth.getFullYear(),visibleMonth.getMonth(),day));
    const button=document.createElement('button'); button.type='button'; button.textContent=String(day);
    button.setAttribute('aria-label',key+(deadlines.some(d=>d.date===key)?' — deadline':' '));
    if (key===selectedDate) button.classList.add('selected'); if(key===today()) button.classList.add('today');
    if(deadlines.some(d=>d.date===key)) button.classList.add('has-deadline');
    button.addEventListener('click',()=>{selectedDate=key;renderCalendar();}); calendarGrid.append(button);
  }
  renderDeadlines(); renderTasks();
}
document.getElementById('prevMonth').addEventListener('click',()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()-1,1);renderCalendar();});
document.getElementById('nextMonth').addEventListener('click',()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1);renderCalendar();});
document.getElementById('deadlineForm').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.getElementById('deadlineInput'); const title = input.value.trim();
  if (!title || deadlines.length >= 300) return;
  deadlines.push({id:makeId(), date:selectedDate, title, done:false});
  input.value = ''; saveDeadlines(); renderCalendar();
});
const calendarToggle = document.getElementById('calendarToggle');
const calendarPanel = document.getElementById('calendarPanel');
const calendarClose = document.getElementById('calendarClose');
const calendarDialog = calendarPanel.querySelector('.calendar-dialog');
let priorFocus = null;
function openCalendar() {
  priorFocus = document.activeElement;
  selectedDate = today();
  visibleMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1);
  renderCalendar();
  calendarPanel.hidden = false;
  document.body.classList.add('modal-open');
  calendarDialog.focus();
}
function closeCalendar() {
  calendarPanel.hidden = true;
  document.body.classList.remove('modal-open');
  if (priorFocus && typeof priorFocus.focus === 'function') priorFocus.focus();
}
calendarToggle.addEventListener('click', openCalendar);
calendarClose.addEventListener('click', closeCalendar);
calendarPanel.querySelector('.calendar-backdrop').addEventListener('click',closeCalendar);
document.addEventListener('keydown', event => {
  if (calendarPanel.hidden) return;
  if (event.key === 'Escape') { closeCalendar(); return; }
  if (event.key === 'Tab') {
    const focusable = [...calendarDialog.querySelectorAll('button:not([disabled]),input:not([disabled])')];
    if (!focusable.length) return;
    const first=focusable[0], last=focusable[focusable.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  }
});
renderCalendar();
