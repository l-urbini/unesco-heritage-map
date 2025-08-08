// Initialize the map centered on a middle point
let map = L.map('map').setView([20, 0], 2);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Store markers for filtering
let markers = [];
let sites = [];
let countryStats = {};

// Initialize the map with UNESCO sites
async function initMap() {
    try {
        const response = await fetch('data/unesco-sites.json');
        const data = await response.json();
        sites = data.features;
        
        // Calculate sites per country
        countryStats = sites.reduce((acc, site) => {
            const country = site.properties.country;
            if (!acc[country]) {
                acc[country] = {
                    total: 0,
                    cultural: 0,
                    natural: 0,
                    mixed: 0
                };
            }
            acc[country].total++;
            acc[country][site.properties.type.toLowerCase()]++;
            return acc;
        }, {});

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

        // Create country info panel
        const countryInfoPanel = document.createElement('div');
        countryInfoPanel.id = 'countryInfoPanel';
        countryInfoPanel.className = 'country-info-panel';
        document.querySelector('main').appendChild(countryInfoPanel);

        // Initial update of country info
        updateCountryInfo('all');
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
        const { name, type, description, country } = site.properties;

        // Create custom marker
        const marker = L.circleMarker([coordinates[1], coordinates[0]], {
            radius: 8,
            fillColor: type === 'Cultural' ? '#e74c3c' : type === 'Natural' ? '#27ae60' : '#f1c40f',
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
    const country = properties.country;
    const stats = countryStats[country];
    
    siteDetails.innerHTML = `
        <h3>${properties.name}</h3>
        <p><strong>Type:</strong> ${properties.type}</p>
        <p><strong>Country:</strong> ${country} (${stats.total} UNESCO sites)</p>
        <p>${properties.description}</p>
    `;
}

// Update the country info panel
function updateCountryInfo(country) {
    const countryInfoPanel = document.getElementById('countryInfoPanel');
    if (country === 'all') {
        const totalSites = sites.length;
        const culturalSites = sites.filter(site => site.properties.type === 'Cultural').length;
        const naturalSites = sites.filter(site => site.properties.type === 'Natural').length;
        const mixedSites = sites.filter(site => site.properties.type === 'Mixed').length;
        
        countryInfoPanel.innerHTML = `
            <h3>Global UNESCO Sites</h3>
            <p>Total Sites: ${totalSites}</p>
            <p>Cultural Sites: ${culturalSites}</p>
            <p>Natural Sites: ${naturalSites}</p>
            <p>Mixed Sites: ${mixedSites}</p>
        `;
    } else {
        const stats = countryStats[country];
        countryInfoPanel.innerHTML = `
            <h3>${country} UNESCO Sites</h3>
            <p>Total Sites: ${stats.total}</p>
            <p>Cultural Sites: ${stats.cultural}</p>
            <p>Natural Sites: ${stats.natural}</p>
            <p>Mixed Sites: ${stats.mixed}</p>
        `;
    }
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
    updateCountryInfo(selectedCountry);

    // Update the filter labels with counts
    if (selectedCountry !== 'all') {
        const stats = countryStats[selectedCountry];
        document.getElementById('countryFilter').title = `${selectedCountry} - ${stats.total} UNESCO sites`;
    }
}

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', initMap);