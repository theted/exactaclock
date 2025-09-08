// Main application logic
class ExactaClockApp {
  constructor() {
    this.userLocation = null;
    this.clockInterval = null;
    this.init();
  }

  init = () => {
    this.bindEvents();
    this.requestLocation();
  };

  bindEvents = () => {
    const locationBtn = document.getElementById('locationBtn');
    locationBtn.addEventListener('click', this.requestLocation);
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

  onLocationSuccess = (position) => {
    this.userLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    this.hideError();
    this.hideLocationButton();
    this.showClock();
    this.startClock();
  };

  onLocationError = (error) => {
    let errorMessage = 'Unable to retrieve your location. ';
    
    switch(error.code) {
      case error.PERMISSION_DENIED:
        errorMessage += 'Location access was denied. Please click the button below to try again.';
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
    
    // Format exact GMT time
    const exactTime = result.exactTime || new Date();
    const timeString = exactTime.toLocaleTimeString('en-US', {
      timeZone: 'UTC',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Format local corrected time
    const localOffset = window.ExactaClock.getTimezone(this.userLocation).offset;
    const localTime = new Date(exactTime.getTime() + (localOffset * 60 * 60 * 1000));
    const localTimeString = localTime.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Update DOM elements
    document.getElementById('exactTime').textContent = timeString + ' GMT';
    document.getElementById('coordinates').textContent = 
      `${this.userLocation.lat.toFixed(4)}°, ${this.userLocation.lng.toFixed(4)}°`;
    document.getElementById('timezone').textContent = result.currentTimezone || 'UTC+0';
    document.getElementById('adjustment').textContent = 
      result.adjustment ? `${result.adjustment} minutes` : '0 minutes';
    document.getElementById('localTime').textContent = localTimeString;
  };

  showError = (message) => {
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

  hideLoading = () => {
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  };
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ExactaClockApp();
});