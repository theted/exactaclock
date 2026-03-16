// Main application logic
class ExactaClockApp {
  constructor() {
    this.userLocation = null;
    this.clockInterval = null;
    this.locationTrackingId = null;
    this.trackingInterval = 30000; // 30 seconds default
    this.movementThreshold = 0.001; // ~100 meters in degrees
    this.isTracking = false;
    this.map = null;
    this.marker = null;
    this.isManualMode = false;
    this.init();
  }

  init = () => {
    this.bindEvents();
    this.requestLocation();
  };

  bindEvents = () => {
    const locationBtn = document.getElementById('locationBtn');
    locationBtn.addEventListener('click', this.requestLocation);

    // Map controls
    const gpsMode = document.getElementById('gpsMode');
    const manualMode = document.getElementById('manualMode');
    const applyCoords = document.getElementById('applyCoords');

    gpsMode.addEventListener('click', this.switchToGPSMode);
    manualMode.addEventListener('click', this.switchToManualMode);
    applyCoords.addEventListener('click', this.applyManualCoordinates);

    // Quick location buttons
    const quickLocButtons = document.querySelectorAll('.quick-loc-btn');
    quickLocButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const lat = parseFloat(e.target.getAttribute('data-lat'));
        const lng = parseFloat(e.target.getAttribute('data-lng'));
        this.jumpToLocation(lat, lng);
      });
    });
  };

  requestLocation = () => {
    if (!navigator.geolocation) {
      this.showError('Geolocation is not supported by this browser.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      this.onLocationSuccess,
      this.onLocationError,
      options
    );
  };

  onLocationSuccess = position => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    // Check if location has changed significantly
    if (this.userLocation && this.hasLocationChanged(newLocation)) {
      this.showLocationUpdateNotice();
    }

    this.userLocation = newLocation;
    this.hideError();
    this.hideLocationButton();
    this.showClock();
    this.showMap();
    this.startClock();
    this.startLocationTracking();
    this.initializeMap();
  };

  onLocationError = error => {
    let errorMessage = 'Unable to retrieve your location. ';

    switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage +=
          'Location access was denied. Please click the button below to try again.';
      this.showLocationButton();
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage += 'Location information is unavailable.';
      break;
    case error.TIMEOUT:
      errorMessage += 'Location request timed out. Please try again.';
      this.showLocationButton();
      break;
    default:
      errorMessage += 'An unknown error occurred.';
      break;
    }

    this.showError(errorMessage);
    this.hideLoading();
  };

  startClock = () => {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }

    // Update immediately
    this.updateClock();

    // Then update every second
    this.clockInterval = setInterval(this.updateClock, 1000);
  };

  updateClock = () => {
    if (!this.userLocation) return;

    const result = window.ExactaClock.getExactTime(this.userLocation);

    // Get corrected time and apply local timezone offset
    const exactTime = result.exactTime || new Date();
    const localOffset = window.ExactaClock.getTimezone(
      this.userLocation
    ).offset;
    const correctedLocalTime = new Date(
      exactTime.getTime() + localOffset * 60 * 60 * 1000
    );

    // Format corrected local time (main display)
    const correctedTimeString = correctedLocalTime.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Format GMT time for reference
    const gmtTimeString = exactTime.toLocaleTimeString('en-US', {
      timeZone: 'UTC',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Calculate normal local time (standard timezone without corrections)
    const now = new Date();
    const normalLocalTime = new Date(
      now.getTime() + localOffset * 60 * 60 * 1000
    );
    const normalTimeString = normalLocalTime.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Format adjustment display with seconds precision
    let adjustmentText;
    if (result.adjustmentSecondsTotal === 0) {
      adjustmentText = 'No adjustment needed';
    } else if (Math.abs(result.adjustmentSecondsTotal) < 60) {
      // Show seconds when less than 1 minute
      const seconds = Math.abs(result.adjustmentSecondsTotal);
      adjustmentText = `${seconds} second${seconds !== 1 ? 's' : ''} ${result.adjustmentSecondsTotal > 0 ? 'ahead' : 'behind'}`;
    } else {
      // Show minutes and seconds when over 1 minute
      const totalSeconds = Math.abs(result.adjustmentSecondsTotal);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      let text = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      if (seconds > 0) {
        text += `, ${seconds} second${seconds !== 1 ? 's' : ''}`;
      }
      text += ` ${result.adjustmentSecondsTotal > 0 ? 'ahead' : 'behind'}`;
      adjustmentText = text;
    }

    // Update DOM elements
    document.getElementById('exactTime').textContent = correctedTimeString;
    document.getElementById('coordinates').textContent =
      `${this.userLocation.lat.toFixed(4)}°, ${this.userLocation.lng.toFixed(4)}°`;
    document.getElementById('timezone').textContent =
      result.currentTimezone || 'UTC+0';
    document.getElementById('timezoneFull').textContent =
      result.timezoneFull || 'Greenwich Mean Time';
    document.getElementById('adjustment').textContent = adjustmentText;
    document.getElementById('normalTime').textContent = normalTimeString;
    document.getElementById('localTime').textContent = gmtTimeString + ' GMT';
  };

  showError = message => {
    const errorEl = document.getElementById('error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  };

  hideError = () => {
    document.getElementById('error').style.display = 'none';
  };

  showLocationButton = () => {
    document.getElementById('locationBtn').style.display = 'inline-block';
    this.hideLoading();
  };

  hideLocationButton = () => {
    document.getElementById('locationBtn').style.display = 'none';
  };

  showClock = () => {
    document.getElementById('clock').style.display = 'block';
    this.hideLoading();
  };

  showMap = () => {
    document.getElementById('mapContainer').style.display = 'flex';
  };

  hideLoading = () => {
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  };

  // Start continuous location tracking
  startLocationTracking = () => {
    if (this.isTracking) return;
    
    this.isTracking = true;
    
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    };

    // Use watchPosition for continuous tracking
    if (navigator.geolocation) {
      this.locationTrackingId = navigator.geolocation.watchPosition(
        this.onLocationUpdate,
        this.onLocationTrackingError,
        options
      );
    }
  };

  // Stop location tracking
  stopLocationTracking = () => {
    if (this.locationTrackingId && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.locationTrackingId);
      this.locationTrackingId = null;
      this.isTracking = false;
    }
  };

  // Handle location updates during tracking
  onLocationUpdate = position => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    // Check if location has changed significantly
    if (this.hasLocationChanged(newLocation)) {
      this.userLocation = newLocation;
      this.showLocationUpdateNotice();
      
      // Update map marker if in GPS mode
      if (!this.isManualMode && this.marker) {
        this.marker.setLatLng([newLocation.lat, newLocation.lng]);
        this.map.setView([newLocation.lat, newLocation.lng]);
      }
      
      // Clock will update automatically on next tick
    }
  };

  // Handle location tracking errors
  onLocationTrackingError = error => {
    // Don't show errors for tracking failures unless it's permission denied
    if (error.code === error.PERMISSION_DENIED) {
      this.stopLocationTracking();
      this.showError('Location tracking disabled. Click the button to re-enable.');
      this.showLocationButton();
    }
  };

  // Check if location has changed beyond threshold
  hasLocationChanged = newLocation => {
    if (!this.userLocation) return true;
    
    const latDiff = Math.abs(newLocation.lat - this.userLocation.lat);
    const lngDiff = Math.abs(newLocation.lng - this.userLocation.lng);
    
    return latDiff > this.movementThreshold || lngDiff > this.movementThreshold;
  };

  // Show location update notification
  showLocationUpdateNotice = () => {
    const noticeEl = document.getElementById('locationUpdate');
    if (noticeEl && this.userLocation) {
      noticeEl.style.display = 'block';
      noticeEl.innerHTML = `📍 Location updated to ${this.userLocation.lat.toFixed(4)}°, ${this.userLocation.lng.toFixed(4)}° - recalculating time...`;
      
      // Hide notice after 3 seconds
      setTimeout(() => {
        noticeEl.style.display = 'none';
      }, 3000);
    }
  };

  // Initialize Leaflet Map
  initializeMap = () => {
    if (!this.userLocation || !window.L) {
      // Retry after a short delay if Leaflet isn't loaded yet
      setTimeout(() => {
        if (window.L) {
          this.initializeMap();
        }
      }, 500);
      return;
    }

    // Initialize map
    this.map = L.map('map').setView([this.userLocation.lat, this.userLocation.lng], 10);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add draggable marker (always create as draggable, we'll control it via enable/disable)
    this.marker = L.marker([this.userLocation.lat, this.userLocation.lng], {
      draggable: true,
      title: 'Location marker'
    }).addTo(this.map);

    // Disable dragging initially if in GPS mode
    if (!this.isManualMode) {
      this.marker.dragging.disable();
    }

    // Handle marker drag - always listen, but only act in manual mode
    this.marker.on('dragend', (event) => {
      console.log('Marker drag detected, manual mode:', this.isManualMode);
      if (this.isManualMode) {
        const newPos = event.target.getLatLng();
        console.log('Updating location from drag:', newPos.lat, newPos.lng);
        this.updateLocationFromMap(newPos.lat, newPos.lng);
      }
    });

    // Handle map clicks - always listen, but only act in manual mode
    this.map.on('click', (event) => {
      console.log('Map click detected, manual mode:', this.isManualMode);
      if (this.isManualMode) {
        const newPos = event.latlng;
        console.log('Updating location from click:', newPos.lat, newPos.lng);
        this.marker.setLatLng(newPos);
        this.updateLocationFromMap(newPos.lat, newPos.lng);
      }
    });
  };

  // Update location from map interaction
  updateLocationFromMap = (lat, lng) => {
    console.log('updateLocationFromMap called with:', lat, lng);
    this.userLocation = { lat, lng };
    this.showLocationUpdateNotice();
    
    // Update input fields
    document.getElementById('latInput').value = lat.toFixed(4);
    document.getElementById('lngInput').value = lng.toFixed(4);
    
    // Immediately update clock calculations with new location
    console.log('Calling updateClock...');
    this.updateClock();
    console.log('updateClock completed');
  };

  // Switch to GPS mode
  switchToGPSMode = () => {
    this.isManualMode = false;
    document.getElementById('gpsMode').classList.add('active');
    document.getElementById('manualMode').classList.remove('active');
    document.getElementById('coordsInput').style.display = 'none';
    document.getElementById('quickLocations').style.display = 'none';
    
    // Update instructions
    document.getElementById('gpsInstructions').style.display = 'inline';
    document.getElementById('manualInstructions').style.display = 'none';
    
    if (this.marker) {
      this.marker.dragging.disable();
    }
    
    this.startLocationTracking();
    this.requestLocation();
  };

  // Switch to manual mode
  switchToManualMode = () => {
    this.isManualMode = true;
    document.getElementById('gpsMode').classList.remove('active');
    document.getElementById('manualMode').classList.add('active');
    document.getElementById('coordsInput').style.display = 'flex';
    document.getElementById('quickLocations').style.display = 'flex';
    
    // Update instructions
    document.getElementById('gpsInstructions').style.display = 'none';
    document.getElementById('manualInstructions').style.display = 'inline';
    
    if (this.marker) {
      this.marker.dragging.enable();
    }
    
    this.stopLocationTracking();
    
    // Populate input fields with current location
    if (this.userLocation) {
      document.getElementById('latInput').value = this.userLocation.lat.toFixed(4);
      document.getElementById('lngInput').value = this.userLocation.lng.toFixed(4);
    }
  };

  // Apply manual coordinates
  applyManualCoordinates = () => {
    const lat = parseFloat(document.getElementById('latInput').value);
    const lng = parseFloat(document.getElementById('lngInput').value);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Please enter valid coordinates (lat: -90 to 90, lng: -180 to 180)');
      return;
    }

    this.userLocation = { lat, lng };
    
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng]);
    }
    
    this.showLocationUpdateNotice();
    
    // Immediately update clock calculations with new location
    this.updateClock();
  };

  // Jump to a specific location (for quick location buttons)
  jumpToLocation = (lat, lng) => {
    if (!this.isManualMode) {
      this.switchToManualMode();
    }
    
    this.userLocation = { lat, lng };
    
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], 10);
    }
    
    // Update input fields
    document.getElementById('latInput').value = lat.toFixed(4);
    document.getElementById('lngInput').value = lng.toFixed(4);
    
    this.showLocationUpdateNotice();
    this.updateClock();
  };
}

// Leaflet map initialization is handled directly in the initializeMap method

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new ExactaClockApp();
  
  // Cleanup location tracking on page unload
  window.addEventListener('beforeunload', () => {
    app.stopLocationTracking();
  });
});
