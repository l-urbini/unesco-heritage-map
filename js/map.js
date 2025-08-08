// Initialize the map centered on a middle point
let map = L.map('map').setView([20, 0], 2);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Store markers for filtering
let markers = [];
let sites = [];
let countrySiteCounts = {};

// Populate country filter dropdown and calculate initial counts
function populateCountryFilter(features) {
    const countryFilter = document.getElementById('countryFilter');
    countryFilter.innerHTML = '<option value="all">All Countries</option>'; // Reset options

    const counts = {};
    features.forEach(site => {
        const country = site.properties.country;
        if (country) {
            counts[country] = (counts[country] || 0) + 1;
        }
    });
    countrySiteCounts = counts; // Store for later use

    const sortedCountries = Object.keys(counts).sort();
    sortedCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = `${country} (${counts[country]})`;
        countryFilter.appendChild(option);
    });
}

// Update global statistics panel
function updateGlobalStatistics(features) {
    const totalSites = features.length;
    const culturalSites = features.filter(site => site.properties.type === 'Cultural').length;
    const naturalSites = features.filter(site => site.properties.type === 'Natural').length;
    const mixedSites = features.filter(site => site.properties.type === 'Mixed').length;

    document.getElementById('totalSites').textContent = totalSites;
    document.getElementById('culturalSites').textContent = culturalSites;
    document.getElementById('naturalSites').textContent = naturalSites;
    document.getElementById('mixedSites').textContent = mixedSites;
}

// Initialize the map with UNESCO sites
async function initMap() {
    try {
        const response = await fetch('data/unesco-sites.json');
        const data = await response.json();
        sites = data.features;

        // Calculate initial country counts and populate filter
        populateCountryFilter(sites);
        updateGlobalStatistics(sites);

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
function createMarkers(sitesToDisplay) {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    sitesToDisplay.forEach(site => {
        const { coordinates } = site.geometry;
        const { name, type, description, country, inscribed_year } = site.properties;

        // Create custom marker
        const marker = L.circleMarker([coordinates[1], coordinates[0]], {
            radius: 8,
            fillColor: type === 'Cultural' ? '#e74c3c' : (type === 'Natural' ? '#27ae60' : '#3498db'),
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });

        // Add popup with site information
        marker.bindPopup(`
            <div class="site-details-popup">
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
    updateCountryInfoPanel(properties.country);
}

// Update the country information panel
function updateCountryInfoPanel(selectedCountry) {
    const countryInfoPanel = document.getElementById('countryInfo');
    if (selectedCountry === 'all') {
        countryInfoPanel.innerHTML = `
            <h3>Country Statistics</h3>
            <p>Select a country to see its heritage sites breakdown</p>
        `;
    } else {
        const sitesInCountry = sites.filter(site => site.properties.country === selectedCountry);
        const culturalCount = sitesInCountry.filter(site => site.properties.type === 'Cultural').length;
        const naturalCount = sitesInCountry.filter(site => site.properties.type === 'Natural').length;
        const mixedCount = sitesInCountry.filter(site => site.properties.type === 'Mixed').length;
        const totalCountrySites = sitesInCountry.length;

        countryInfoPanel.innerHTML = `
            <h3>${selectedCountry} Sites</h3>
            <p>Total Sites: ${totalCountrySites}</p>
            <p>Cultural Sites: ${culturalCount}</p>
            <p>Natural Sites: ${naturalCount}</p>
            <p>Mixed Sites: ${mixedCount}</p>
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
    updateCountryInfoPanel(selectedCountry);
}

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map elements
    const statsPanel = document.getElementById('statsPanel');
    const siteInfo = document.getElementById('siteInfo');
    const countryInfo = document.getElementById('countryInfo');
    
    // Make sure all required elements exist
    if (statsPanel && siteInfo && countryInfo) {
        initMap();
    } else {
        console.error('Required DOM elements are missing');
    }
});