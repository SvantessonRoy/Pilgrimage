// weeks.js
// Dynamically loads week data into week.html based on query parameter

// Helper to get query parameter
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Fetch week data from JSON and render
async function loadWeek() {
    const weekId = getQueryParam('week');
    if (!weekId) {
        document.getElementById('week-title').textContent = 'Ingen vecka vald';
        document.getElementById('week-content').textContent = '';
        return;
    }
    try {
        const res = await fetch('../json/weeks.json');
        const weeks = await res.json();
        // Find week by week, number, or id (since your JSON uses "week")
        const week = weeks.find(w => String(w.week) === String(weekId) || String(w.number) === String(weekId) || String(w.id) === String(weekId));
        if (!week) {
            document.getElementById('week-title').textContent = 'Vecka ej hittad';
            document.getElementById('week-content').textContent = '';
            return;
        }
        document.getElementById('week-title').textContent = week.title || `Vecka ${week.week || weekId}`;
        let html = '';
        // Week summary section (image + info)
        html += '<div class="week-summary">';
        if (week.image) {
            html += `<div class="week-summary-img" style="background-image:url('../assets/${week.image}')"></div>`;
        }
        html += '<div class="week-summary-text">';
        if (week.route) html += `<p><strong>Rutt:</strong> ${week.route}</p>`;
        if (week.distance) html += `<p><strong>Distans:</strong> ${week.distance}</p>`;
        if (week.description) html += `<p>${week.description}</p>`;
        html += '</div></div>';

        // Render day cards for this week using daysweekX.json
        try {
            const daysRes = await fetch(`../json/daysweek${week.week}.json`);
            const daysObj = await daysRes.json();
            const weekKey = `daysW${week.week}`;
            const weekDays = Array.isArray(daysObj) ? daysObj : daysObj[weekKey] || [];
            if (weekDays.length > 0) {
                html += '<div class="stage-list">';
                weekDays.forEach(day => {
                    // Use placeholder if no image
                    const img = day.image ? day.image : 'placeholder.jpg';
                    // Link to dynamic day page
                    const dayUrl = `day.html?week=${encodeURIComponent(week.week)}&day=${encodeURIComponent(day.day)}`;
                    // Calculate global day number
                    let globalDayNumber = 0;
                    if (typeof day.day === 'number' && typeof week.week === 'number') {
                        globalDayNumber = day.day;
                    } else if (!isNaN(parseInt(day.day)) && !isNaN(parseInt(week.week))) {
                        globalDayNumber = (parseInt(week.week) - 1) * 7 + parseInt(day.day);
                    }
                    const dayNumber = globalDayNumber ? `Dag ${globalDayNumber}` : '';
                    html += `
                    <a class="stage-card" href="${dayUrl}">
                        <div style="display:flex;flex-direction:column;align-items:center;">
                            <div class="stage-img" style="background-image:url('../assets/${img}');"></div>
                        </div>
                        <div class="stage-card-content">
                            <div class="stage-img-number" style="font-weight:bold;font-size:1.1em;margin-bottom:8px;text-align:left;">${dayNumber}</div>
                            <div class="stage-title">${day.title}</div>
                            <div class="stage-meta"><strong>Distans:</strong> ${day.distance} &nbsp; <strong>Höjdmeter:</strong> ${day.elevation_gain || ''} / ${day.elevation_loss || ''}</div>
                            <div class="stage-meta"><strong>Boende:</strong> ${day.accommodation || ''}</div>
                            <div class="stage-desc">${day.short_desc || ''}<br>${day.long_desc || ''}</div>
                        </div>
                    </a>`;
                });
                html += '</div>';
            } else {
                html += '<p>Inga dagsetapper för denna vecka.</p>';
            }
        } catch (e) {
            html += '<p>Kunde inte ladda dagsetapper.</p>';
        }
        document.getElementById('week-content').innerHTML = html;
        // Add navigation buttons for previous/next week
        const currentWeekNum = parseInt(week.week);
        let navButtons = '<div class="week-nav-buttons" style="display:flex;justify-content:center;gap:16px;margin:32px 0 0 0;">';
        if (currentWeekNum > 1) {
            navButtons += `<a href="week.html?week=${currentWeekNum - 1}" class="week-nav-btn" style="padding:8px 20px;background:#eee;border-radius:6px;text-decoration:none;font-weight:bold;">&laquo; Föregående vecka</a>`;
        }
        if (currentWeekNum < 8) {
            navButtons += `<a href="week.html?week=${currentWeekNum + 1}" class="week-nav-btn" style="padding:8px 20px;background:#eee;border-radius:6px;text-decoration:none;font-weight:bold;">Nästa vecka &raquo;</a>`;
        }
        navButtons += '</div>';
        document.getElementById('week-content').innerHTML = html + navButtons;
    } catch (e) {
        document.getElementById('week-title').textContent = 'Fel vid laddning av vecka';
        document.getElementById('week-content').textContent = '';
    }
}

window.addEventListener('DOMContentLoaded', loadWeek);
