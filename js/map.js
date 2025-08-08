// Initialize the map centered on a middle point
let map = L.map('map').setView([20, 0], 2);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Store markers for filtering
let markers = [];
let sites = [];

// Initialize the map with UNESCO sites
async function initMap() {
    try {
        const response = await fetch('data/unesco-sites.json');
        const data = await response.json();
        sites = data.features;
        
        // Populate country filter
        const countries = [...new Set(sites.map(site => site.properties.country))].sort();
        const countryFilter = document.getElementById('countryFilter');
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countryFilter.appendChild(option);
        });

        // Create markers for all sites
        createMarkers(sites);

        // Add event listeners for filters
        document.getElementById('typeFilter').addEventListener('change', filterSites);
        document.getElementById('countryFilter').addEventListener('change', filterSites);
    } catch (error) {
        console.error('Error loading UNESCO sites:', error);
    }
}

// Create markers for the sites
function createMarkers(sites) {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    sites.forEach(site => {
        const { coordinates } = site.geometry;
        const { name, type, description, inscribed_year, country } = site.properties;

        // Create custom marker
        const marker = L.circleMarker([coordinates[1], coordinates[0]], {
            radius: 8,
            fillColor: type === 'Cultural' ? '#e74c3c' : '#27ae60',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });

        // Add popup with site information
        marker.bindPopup(`
            <div class="site-details">
                <h3>${name}</h3>
                <p><strong>Type:</strong> ${type}</p>
                <p><strong>Country:</strong> ${country}</p>
                <p><strong>Inscribed:</strong> ${inscribed_year}</p>
                <p>${description}</p>
            </div>
        `);

        // Add click event to update site info panel
        marker.on('click', () => updateSiteInfo(site.properties));

        marker.addTo(map);
        markers.push(marker);
    });
}

// Update the site information panel
function updateSiteInfo(properties) {
    const siteDetails = document.getElementById('siteDetails');
    siteDetails.innerHTML = `
        <h3>${properties.name}</h3>
        <p><strong>Type:</strong> ${properties.type}</p>
        <p><strong>Country:</strong> ${properties.country}</p>
        <p><strong>Inscribed:</strong> ${properties.inscribed_year}</p>
        <p>${properties.description}</p>
    `;
}

// Filter sites based on selected type and country
function filterSites() {
    const selectedType = document.getElementById('typeFilter').value;
    const selectedCountry = document.getElementById('countryFilter').value;

    const filteredSites = sites.filter(site => {
        const typeMatch = selectedType === 'all' || site.properties.type === selectedType;
        const countryMatch = selectedCountry === 'all' || site.properties.country === selectedCountry;
        return typeMatch && countryMatch;
    });

    createMarkers(filteredSites);
}

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', initMap);