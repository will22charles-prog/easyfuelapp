// Location Services and Bluetooth Pairing Functions for Easy Fuel

// ============================================
// LOCATION SERVICES
// ============================================

let userLocation = null;
let nearbyStores = [];
let selectedStore = null;

// Request user's location
async function requestLocation() {
    const button = document.getElementById('locationButton');
    const buttonText = document.getElementById('locationButtonText');
    const status = document.getElementById('locationStatus');
    
    if (!navigator.geolocation) {
        status.textContent = '❌ Geolocation is not supported by your browser';
        status.style.display = 'block';
        status.style.color = 'var(--accent)';
        return;
    }
    
    buttonText.textContent = '📍 Getting location...';
    button.disabled = true;
    status.textContent = 'Requesting permission...';
    status.style.display = 'block';
    status.style.color = 'var(--text-secondary)';
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            console.log('✅ Location obtained:', userLocation);
            
            status.textContent = '✅ Location enabled! Finding nearby stores...';
            status.style.color = 'var(--primary)';
            
            // Show location display
            document.getElementById('locationDisplay').style.display = 'block';
            
            // Get address from coordinates (reverse geocoding)
            await getAddressFromCoordinates(userLocation.lat, userLocation.lng);
            
            // Find nearby grocery stores
            await findNearbyStores(userLocation.lat, userLocation.lng);
            
            buttonText.textContent = '✅ Location Enabled';
            button.classList.add('btn-success');
        },
        (error) => {
            console.error('❌ Geolocation error:', error);
            let errorMessage = '';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = '❌ Location access denied. Please enable location in your browser settings.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = '❌ Location information unavailable. Please try again.';
                    break;
                case error.TIMEOUT:
                    errorMessage = '❌ Location request timed out. Please try again.';
                    break;
                default:
                    errorMessage = '❌ An unknown error occurred.';
            }
            
            status.textContent = errorMessage;
            status.style.color = 'var(--accent)';
            buttonText.textContent = '📍 Retry Location';
            button.disabled = false;
        }
    );
}

// Reverse geocoding (coordinates to address)
async function getAddressFromCoordinates(lat, lng) {
    try {
        // Using OpenStreetMap Nominatim (free, no API key needed)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'EasyFuelApp/1.0'
                }
            }
        );
        
        const data = await response.json();
        const addressEl = document.getElementById('locationAddress');
        
        if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || '';
            const state = data.address.state || '';
            const zip = data.address.postcode || '';
            
            addressEl.textContent = `${city}, ${state} ${zip}`.trim();
        } else {
            addressEl.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        
        // Save to user data
        if (currentUser) {
            if (!currentUser.data) currentUser.data = {};
            currentUser.data.location = { lat, lng, address: addressEl.textContent };
            saveUserData();
        }
        
    } catch (error) {
        console.error('Error getting address:', error);
        document.getElementById('locationAddress').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// Find nearby grocery stores using Overpass API (OpenStreetMap)
async function findNearbyStores(lat, lng) {
    try {
        // Search radius in meters
        const radius = 5000; // 5km
        
        // Overpass API query for supermarkets
        const query = `
            [out:json][timeout:25];
            (
                node["shop"="supermarket"](around:${radius},${lat},${lng});
                way["shop"="supermarket"](around:${radius},${lat},${lng});
            );
            out center;
        `;
        
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });
        
        const data = await response.json();
        
        console.log('📍 Found stores:', data.elements.length);
        
        // Process and display stores
        nearbyStores = data.elements.map(store => {
            const storeLat = store.lat || store.center.lat;
            const storeLng = store.lon || store.center.lon;
            const distance = calculateDistance(lat, lng, storeLat, storeLng);
            
            return {
                id: store.id,
                name: store.tags.name || 'Grocery Store',
                brand: store.tags.brand || store.tags.name || 'Independent',
                address: store.tags['addr:street'] || '',
                distance: distance,
                lat: storeLat,
                lng: storeLng
            };
        });
        
        // Sort by distance
        nearbyStores.sort((a, b) => a.distance - b.distance);
        
        // Display stores
        displayNearbyStores(nearbyStores.slice(0, 10)); // Show top 10
        
    } catch (error) {
        console.error('Error finding stores:', error);
        document.getElementById('locationStatus').textContent = 
            '⚠️ Could not find stores. You can select manually below.';
        document.getElementById('locationStatus').style.color = 'var(--accent-alt)';
    }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

// Display nearby stores
function displayNearbyStores(stores) {
    const storesList = document.getElementById('storesList');
    const section = document.getElementById('nearbyStoresSection');
    
    if (stores.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    storesList.innerHTML = '';
    
    stores.forEach(store => {
        const storeCard = document.createElement('div');
        storeCard.className = 'store-card';
        storeCard.onclick = () => selectNearbyStore(store);
        storeCard.id = `store-${store.id}`;
        
        storeCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 0.25rem;">
                        ${store.name}
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.25rem;">
                        ${store.brand}
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">
                        📍 ${store.distance.toFixed(1)} km away
                    </div>
                </div>
                <div class="store-check" id="check-${store.id}">✓</div>
            </div>
        `;
        
        storesList.appendChild(storeCard);
    });
}

// Select a nearby store
function selectNearbyStore(store) {
    selectedStore = store;
    
    // Update UI
    document.querySelectorAll('.store-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.getElementById(`store-${store.id}`).classList.add('selected');
    
    // Clear manual selection
    document.getElementById('onboarding-store').value = '';
    
    // Save to user data
    if (currentUser) {
        if (!currentUser.data) currentUser.data = {};
        currentUser.data.selectedStore = store;
        saveUserData();
    }
    
    console.log('✅ Selected store:', store.name);
}

// CSS for store cards (add to your styles)
const storeCardStyles = `
    .store-card {
        padding: 1.25rem;
        background: var(--bg-card);
        border: 2px solid var(--border);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .store-card:hover {
        border-color: var(--primary);
        transform: translateX(4px);
    }
    
    .store-card.selected {
        border-color: var(--primary);
        background: rgba(127, 232, 142, 0.08);
        box-shadow: 0 0 0 2px rgba(127, 232, 142, 0.2);
    }
    
    .store-check {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        color: transparent;
        transition: all 0.3s ease;
    }
    
    .store-card.selected .store-check {
        background: var(--gradient-1);
        border-color: var(--primary);
        color: var(--bg-dark);
    }
`;

// ============================================
// BLUETOOTH PAIRING
// ============================================

let bluetoothDevice = null;
let pairedDevices = [];

// Check if Bluetooth is available
function isBluetoothAvailable() {
    return navigator.bluetooth !== undefined;
}

// Scan for Bluetooth devices
async function scanBluetoothDevices() {
    const button = document.getElementById('bluetoothScanButton');
    const buttonText = document.getElementById('bluetoothButtonText');
    const status = document.getElementById('bluetoothStatus');
    
    if (!isBluetoothAvailable()) {
        status.innerHTML = '<div style="color: var(--accent);">❌ Bluetooth is not supported on this device/browser. Try Chrome on Android or use the desktop app.</div>';
        status.style.display = 'block';
        return;
    }
    
    try {
        buttonText.textContent = '🔵 Scanning...';
        button.disabled = true;
        status.innerHTML = '<div>Scanning for nearby Bluetooth devices...</div>';
        status.style.display = 'block';
        
        // Request Bluetooth device
        const device = await navigator.bluetooth.requestDevice({
            // Accept all devices or filter by services
            acceptAllDevices: true,
            optionalServices: [
                'heart_rate',           // Heart rate monitors
                'battery_service',      // Device battery
                'device_information',   // Device info
                'cycling_power',        // Power meters
                'cycling_speed_and_cadence'  // Speed/cadence sensors
            ]
        });
        
        console.log('✅ Device selected:', device.name);
        
        // Connect to device
        await connectBluetoothDevice(device);
        
        buttonText.textContent = '🔵 Scan for More Devices';
        button.disabled = false;
        
    } catch (error) {
        console.error('Bluetooth error:', error);
        
        if (error.name === 'NotFoundError') {
            status.innerHTML = '<div style="color: var(--text-secondary);">No device selected</div>';
        } else {
            status.innerHTML = `<div style="color: var(--accent);">❌ Error: ${error.message}</div>`;
        }
        
        buttonText.textContent = '🔵 Scan for Bluetooth Devices';
        button.disabled = false;
    }
}

// Connect to a Bluetooth device
async function connectBluetoothDevice(device) {
    const status = document.getElementById('bluetoothStatus');
    
    try {
        status.innerHTML = `<div>Connecting to ${device.name}...</div>`;
        
        const server = await device.gatt.connect();
        console.log('✅ Connected to GATT server');
        
        // Add to paired devices
        const pairedDevice = {
            id: device.id,
            name: device.name || 'Unknown Device',
            connected: true,
            server: server
        };
        
        pairedDevices.push(pairedDevice);
        
        // Update UI
        displayPairedDevices();
        
        status.innerHTML = `<div style="color: var(--primary);">✅ Successfully connected to ${device.name}</div>`;
        
        // Save to user data
        if (currentUser) {
            if (!currentUser.data) currentUser.data = {};
            if (!currentUser.data.bluetoothDevices) currentUser.data.bluetoothDevices = [];
            currentUser.data.bluetoothDevices.push({
                id: device.id,
                name: device.name
            });
            saveUserData();
        }
        
        // Listen for disconnection
        device.addEventListener('gattserverdisconnected', () => {
            console.log('Device disconnected:', device.name);
            pairedDevice.connected = false;
            displayPairedDevices();
        });
        
    } catch (error) {
        console.error('Connection error:', error);
        status.innerHTML = `<div style="color: var(--accent);">❌ Failed to connect: ${error.message}</div>`;
    }
}

// Display paired devices
function displayPairedDevices() {
    const section = document.getElementById('pairedDevicesList');
    const list = document.getElementById('pairedDevices');
    
    if (pairedDevices.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    list.innerHTML = '';
    
    pairedDevices.forEach(device => {
        const deviceCard = document.createElement('div');
        deviceCard.style.cssText = `
            padding: 1rem;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const statusIcon = device.connected ? '🟢' : '🔴';
        const statusText = device.connected ? 'Connected' : 'Disconnected';
        
        deviceCard.innerHTML = `
            <div>
                <div style="font-weight: 600;">${statusIcon} ${device.name}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${statusText}</div>
            </div>
            <button 
                onclick="disconnectBluetoothDevice('${device.id}')"
                style="padding: 0.5rem 1rem; background: transparent; border: 1px solid var(--border); color: var(--text-secondary); border-radius: 6px; cursor: pointer;">
                Disconnect
            </button>
        `;
        
        list.appendChild(deviceCard);
    });
}

// Disconnect Bluetooth device
function disconnectBluetoothDevice(deviceId) {
    const device = pairedDevices.find(d => d.id === deviceId);
    if (device && device.server) {
        device.server.disconnect();
        pairedDevices = pairedDevices.filter(d => d.id !== deviceId);
        displayPairedDevices();
        
        console.log('✅ Device disconnected');
    }
}

// ============================================
// APP INTEGRATIONS (Placeholder)
// ============================================

function connectApp(appName) {
    alert(`🔗 ${appName} integration coming soon! This will allow you to sync data from ${appName} into Easy Fuel.`);
    console.log('App connection requested:', appName);
    
    // In production, this would open OAuth flow or API connection
}

// Add styles dynamically
const style = document.createElement('style');
style.textContent = storeCardStyles;
document.head.appendChild(style);

console.log('✅ Location and Bluetooth functions loaded');
