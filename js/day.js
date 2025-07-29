// Helper to get query parameter
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Render the day page dynamically
async function loadDay() {
    const weekId = getQueryParam('week');
    const dayId = getQueryParam('day');
    if (!weekId || !dayId) {
        document.getElementById('day-title').textContent = 'Ingen dag vald';
        document.getElementById('day-meta').textContent = '';
        document.getElementById('day-desc').textContent = '';
        document.getElementById('day-accommodation').textContent = '';
        document.getElementById('day-gallery').innerHTML = '';
        document.getElementById('day-back-link').innerHTML = '<a href="week.html?week=' + (weekId || '') + '">← Tillbaka till Vecka</a>';
        return;
    }
    try {
        const daysRes = await fetch(`../json/daysweek${weekId}.json`);
        const daysObj = await daysRes.json();
        const weekKey = `daysW${weekId}`;
        const weekDays = Array.isArray(daysObj) ? daysObj : daysObj[weekKey] || [];
        const day = weekDays.find(d => String(d.day) === String(dayId));
        if (!day) {
            document.getElementById('day-title').textContent = 'Dag ej hittad';
            document.getElementById('day-meta').textContent = '';
            document.getElementById('day-desc').textContent = '';
            document.getElementById('day-accommodation').textContent = '';
            document.getElementById('day-gallery').innerHTML = '';
            document.getElementById('day-back-link').innerHTML = `<a href="week.html?week=${weekId}">← Tillbaka till Vecka ${weekId}</a>`;
            return;
        }
        // Title
        document.getElementById('day-title').textContent = `Dag ${day.day}: ${day.title}`;
        // Meta
        let meta = '';
        if (day.date) meta += day.date + ' | ';
        if (day.distance) meta += 'Distans: ' + day.distance + ' | ';
        if (day.elevation_gain) meta += 'Höjdmeter: ' + day.elevation_gain;
        document.getElementById('day-meta').textContent = meta;
        // Description
        let desc = '';
        if (day.short_desc) desc += `<strong>${day.short_desc}</strong><br>`;
        if (day.long_desc) desc += day.long_desc;
        document.getElementById('day-desc').innerHTML = desc;
        // Accommodation
        document.getElementById('day-accommodation').textContent = day.accommodation || '';
        // Gallery (show up to 10 images, or placeholders)
        let gallery = '';
        let images = [];
        let captions = [];
        if (day.gallery && Array.isArray(day.gallery) && day.gallery.length > 0) {
            images = day.gallery;
        } else if (day.images && Array.isArray(day.images) && day.images.length > 0) {
            images = day.images;
        } else if (day.image) {
            images = [day.image];
        }
        if (day.descriptions_gallery && Array.isArray(day.descriptions_gallery)) {
            captions = day.descriptions_gallery;
        }
        for (let i = 0; i < 10; i++) {
            if (images[i]) {
                // Remove leading 'assets/' if present in path for consistency
                let imgPath = images[i].startsWith('assets/') ? images[i].substring(7) : images[i];
                let caption = captions[i] || '';
                gallery += `
                    <div class="gallery-photo-container">
                        <div class="gallery-photo" style="background-image:url('../assets/${imgPath}'); background-size:cover; background-position:center; cursor:pointer;" data-img="../assets/${imgPath}" tabindex="0" aria-label="Visa större bild"></div>
                        <div class="gallery-caption">${caption}</div>
                    </div>
                `;
            }
        }
        document.getElementById('day-gallery').innerHTML = gallery;

        // Modal for enlarged image
        if (!document.getElementById('img-modal')) {
            const modalHtml = `
                <div id="img-modal" style="display:none;position:fixed;z-index:10000;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);justify-content:center;align-items:center;flex-direction:column;">
                    <span id="img-modal-close" style="position:absolute;top:30px;right:40px;font-size:3em;color:#fff;cursor:pointer;z-index:10001;">&times;</span>
                    <img id="img-modal-img" src="" alt="Större bild" style="max-width:90vw;max-height:80vh;box-shadow:0 0 30px #000;">
                    <div id="img-modal-caption" style="color:#fff;margin-top:1em;font-size:1.2em;text-align:center;"></div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
        const modal = document.getElementById('img-modal');
        const modalImg = document.getElementById('img-modal-img');
        const modalCaption = document.getElementById('img-modal-caption');
        const modalClose = document.getElementById('img-modal-close');
        // Add click event to gallery photos
        document.querySelectorAll('.gallery-photo').forEach((el, idx) => {
            el.addEventListener('click', function() {
                modal.style.display = 'flex';
                modalImg.src = this.getAttribute('data-img');
                modalCaption.textContent = captions[idx] || '';
            });
            el.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    modal.style.display = 'flex';
                    modalImg.src = this.getAttribute('data-img');
                    modalCaption.textContent = captions[idx] || '';
                }
            });
        });
        // Close modal on click or Esc
        modalClose.onclick = () => { modal.style.display = 'none'; modalImg.src = ''; };
        modal.onclick = (e) => { if (e.target === modal) { modal.style.display = 'none'; modalImg.src = ''; } };
        document.addEventListener('keydown', function(e) {
            if (modal.style.display === 'flex' && (e.key === 'Escape' || e.key === 'Esc')) {
                modal.style.display = 'none';
                modalImg.src = '';
            }
        });
        // Map (if route_map exists)
        if (day.route_map && day.route_map.start && day.route_map.end && day.route_map.polyline) {
            // Load Leaflet if not already loaded
            function renderMap() {
                const map = L.map('day-map').setView([day.route_map.start.lat, day.route_map.start.lng], 12);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                // Draw route polyline
                L.polyline(day.route_map.polyline, {color: '#3e5c3a', weight: 5, opacity: 0.8}).addTo(map);
                // Start marker
                L.marker([day.route_map.start.lat, day.route_map.start.lng])
                  .addTo(map)
                  .bindPopup(`<b>Start:</b> ${day.route_map.start.name}`);
                // End marker
                L.marker([day.route_map.end.lat, day.route_map.end.lng])
                  .addTo(map)
                  .bindPopup(`<b>Mål:</b> ${day.route_map.end.name}`);
                map.fitBounds(L.polyline(day.route_map.polyline).getBounds(), {padding: [20,20]});
            }
            if (typeof L === 'undefined') {
                // Load Leaflet CSS/JS dynamically
                const leafletCss = document.createElement('link');
                leafletCss.rel = 'stylesheet';
                leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(leafletCss);
                const leafletScript = document.createElement('script');
                leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                leafletScript.onload = renderMap;
                document.body.appendChild(leafletScript);
            } else {
                renderMap();
            }
        } else {
            document.getElementById('day-map').innerHTML = '<div style="color:#888;text-align:center;padding:2em 0;">Ingen kartdata för denna dag.</div>';
        }
        // Back link
        document.getElementById('day-back-link').innerHTML = `<a href="week.html?week=${weekId}">← Tillbaka till Vecka ${weekId}</a>`;

        // Previous/Next day navigation (across weeks)
        let navHtml = '<div id="day-nav-buttons" style="position:fixed;bottom:0;left:0;width:100vw;display:flex;justify-content:center;gap:2em;padding:1em 0;background:rgba(255,255,255,0.97);z-index:20000;box-shadow:0 -2px 12px #0002;">';
        const currentIdx = weekDays.findIndex(d => String(d.day) === String(dayId));
        // Previous button logic
        let prevLink = null;
        if (currentIdx > 0) {
            // Previous day in same week
            const prevDay = weekDays[currentIdx - 1];
            prevLink = `day.html?week=${weekId}&day=${prevDay.day}`;
        } else if (Number(weekId) > 1) {
            // Previous week: load last day of previous week
            const prevWeekId = Number(weekId) - 1;
            try {
                // Synchronous fetch is not possible, so we use a placeholder and update after
                prevLink = `#prev-loading`;
            } catch {}
        }
        if (prevLink) {
            navHtml += `<a id="day-nav-prev" href="${prevLink}" class="day-nav-btn" style="padding:0.7em 2em;background:#3e5c3a;border-radius:2em;text-decoration:none;color:#fff;font-weight:bold;box-shadow:0 2px 8px #0002;transition:background 0.2s;">← Föregående dag</a>`;
        } else {
            navHtml += `<span class="day-nav-btn" style="padding:0.7em 2em;background:#b7cbb2;border-radius:2em;color:#fff;font-weight:bold;opacity:0.5;">← Föregående dag</span>`;
        }
        // Next button logic
        let nextLink = null;
        if (currentIdx >= 0 && currentIdx < weekDays.length - 1) {
            // Next day in same week
            const nextDay = weekDays[currentIdx + 1];
            nextLink = `day.html?week=${weekId}&day=${nextDay.day}`;
        } else if (Number(weekId) < 8) {
            // Next week: load first day of next week
            const nextWeekId = Number(weekId) + 1;
            try {
                // Synchronous fetch is not possible, so we use a placeholder and update after
                nextLink = `#next-loading`;
            } catch {}
        }
        if (nextLink) {
            navHtml += `<a id="day-nav-next" href="${nextLink}" class="day-nav-btn" style="padding:0.7em 2em;background:#3e5c3a;border-radius:2em;text-decoration:none;color:#fff;font-weight:bold;box-shadow:0 2px 8px #0002;transition:background 0.2s;">Nästa dag →</a>`;
        } else {
            navHtml += `<span class="day-nav-btn" style="padding:0.7em 2em;background:#b7cbb2;border-radius:2em;color:#fff;font-weight:bold;opacity:0.5;">Nästa dag →</span>`;
        }
        navHtml += '</div>';
        // Remove any existing nav buttons to avoid duplicates
        const oldNav = document.getElementById('day-nav-buttons');
        if (oldNav && oldNav.parentNode) oldNav.parentNode.removeChild(oldNav);
        document.body.insertAdjacentHTML('beforeend', navHtml);

        // If prevLink or nextLink is a placeholder, update it asynchronously
        if (prevLink === '#prev-loading' && Number(weekId) > 1) {
            fetch(`../json/daysweek${Number(weekId) - 1}.json`).then(res => res.json()).then(obj => {
                const prevWeekKey = `daysW${Number(weekId) - 1}`;
                const prevWeekDays = Array.isArray(obj) ? obj : obj[prevWeekKey] || [];
                if (prevWeekDays.length > 0) {
                    const lastDay = prevWeekDays[prevWeekDays.length - 1];
                    const prevA = document.getElementById('day-nav-prev');
                    if (prevA) prevA.href = `day.html?week=${Number(weekId) - 1}&day=${lastDay.day}`;
                }
            });
        }
        if (nextLink === '#next-loading' && Number(weekId) < 8) {
            fetch(`../json/daysweek${Number(weekId) + 1}.json`).then(res => res.json()).then(obj => {
                const nextWeekKey = `daysW${Number(weekId) + 1}`;
                const nextWeekDays = Array.isArray(obj) ? obj : obj[nextWeekKey] || [];
                if (nextWeekDays.length > 0) {
                    const nextA = document.getElementById('day-nav-next');
                    if (nextA) nextA.href = `day.html?week=${Number(weekId) + 1}&day=${nextWeekDays[0].day}`;
                }
            });
        }
    } catch (e) {
        document.getElementById('day-title').textContent = 'Fel vid laddning av dag';
        document.getElementById('day-meta').textContent = '';
        document.getElementById('day-desc').textContent = '';
        document.getElementById('day-accommodation').textContent = '';
        document.getElementById('day-gallery').innerHTML = '';
        document.getElementById('day-back-link').innerHTML = '<a href="week.html">← Tillbaka till Veckor</a>';
    }
}

window.addEventListener('DOMContentLoaded', loadDay);
