document.addEventListener('DOMContentLoaded', function() {
    // Dynamisk rendering av veckokort med bakgrundsbild
    fetch('../json/weeks.json')
        .then(response => response.json())
        .then(weeks => {
            const weekCardsContainer = document.querySelector('.week-cards');
            if (weekCardsContainer) {
                weekCardsContainer.innerHTML = '';
                weeks.forEach(week => {
                    const card = document.createElement('div');
                    card.className = 'week-card';
                    // Om week.image finns, använd den som bakgrund
                    if (week.image) {
                        card.style.backgroundImage = `url('../assets/${week.image}')`;
                        card.style.backgroundSize = 'cover';
                        card.style.backgroundPosition = 'center';
                        card.style.color = '#fff';
                        card.style.textShadow = '0 1px 6px rgba(0,0,0,0.5)';
                    }
                    // Byt till dynamisk länk med DOI eller week.number
                    let weekId = week.week || week.number || week.id || week.doi;
                    card.innerHTML = `
                        <h4>${week.title}</h4>
                        <p>${week.route}</p>
                        <p><strong>Distans:</strong> ${week.distance ? week.distance : ''}</p>
                        <a href="html/week.html?week=${encodeURIComponent(weekId)}" class="week-link-btn">${week.button || 'Visa vecka'}</a>
                    `;
                    weekCardsContainer.appendChild(card);
                });
            }
        });

    // Interaktiv karta med Leaflet och punkter från JSON
    const leafletCss = document.createElement('link');
    leafletCss.rel = 'stylesheet';
    leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCss);
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.onload = function() {
        fetch('../json/map_points.json')
            .then(response => response.json())
            .then(points => {
                const map = L.map('map').setView([42.7, -4.5], 7);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                points.forEach(point => {
                    L.marker([point.lat, point.lng])
                        .addTo(map)
                        .bindPopup(`<b>${point.name}</b><br>${point.desc}`);
                });
            });
    };
    document.body.appendChild(leafletScript);

    // Enkel navigation (placeholder)
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                alert('Den här sidan är under uppbyggnad.');
            }
        });
    });
});
