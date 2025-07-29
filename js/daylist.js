const weekFiles = [
    '../json/daysweek1.json',
    '../json/daysweek2.json',
    '../json/daysweek3.json',
    '../json/daysweek4.json',
    '../json/daysweek5.json',
    '../json/daysweek6.json',
    '../json/daysweek7.json',
    '../json/daysweek8.json'
];

async function loadAllDays() {
    const allDays = [];
    for (const file of weekFiles) {
        try {
            const res = await fetch(file);
            const json = await res.json();
            const days = Object.values(json)[0];
            allDays.push(...days);
        } catch (e) {
            // Ignore missing files
        }
    }
    return allDays;
}

function renderDayList(days) {
    const list = document.getElementById('day-list');
    list.classList.add('day-list-flex');
    days.sort((a, b) => (a.week - b.week) || (a.day - b.day));
    days.forEach(day => {
        const li = document.createElement('li');
        li.innerHTML = `<a class="day-box-link" href="day.html?week=${day.week}&day=${day.day}">Dag ${day.day} (Vecka ${day.week}): ${day.title}</a>`;
        list.appendChild(li);
    });
}

loadAllDays().then(renderDayList);