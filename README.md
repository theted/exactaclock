# Exactaclock 🕐

A GPS-based time correction application that displays the "corrected" GMT time based on your exact coordinates. If you're between two timezones, the time is adjusted proportionally - exactly between two zones gives a 30-minute difference, closer to a timezone center gives less adjustment.

## Features ✨

- **📍 GPS-Based Time Correction**: Calculates exact GMT time based on distance to timezone boundaries
- **🏙️ Nearest City Detection**: Shows the closest major city to your location  
- **🌍 Detailed Timezone Information**: Full timezone names and offset details
- **⏰ Live Clock**: Updates every second with corrected time
- **🎯 Precise Adjustments**: Shows minute-by-minute time corrections
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🔒 Privacy-First**: All calculations done client-side, no data sent to servers

## How It Works

The application uses the Haversine formula to calculate your distance to timezone boundaries. The closer you are to a timezone border, the more your time gets adjusted towards the neighboring timezone. This creates a smooth time gradient across the Earth rather than sharp timezone jumps.

## Quick Start 🚀

### Prerequisites
- A modern web browser with GPS/location support
- Node.js and npm (for local development server)
- HTTPS connection (required for GPS access in most browsers)

### Running the Application

1. **Clone or download** this repository:
   ```bash
   git clone <repository-url>
   cd exactaclock
   ```

2. **Install dependencies and start the web server**:
   ```bash
   # Install dependencies
   npm install
   
   # Start the development server (recommended)
   npm start
   
   # Alternative: serve without auto-opening browser
   npm run serve
   ```

3. **Allow location access** when prompted by your browser (the browser will open automatically with `npm start`)

4. **View your corrected time** - the app will show:
   - Current exact GMT time with corrections
   - Your precise coordinates
   - Nearest major city
   - Timezone information
   - Time adjustment details
   - Corrected local time

### For HTTPS (Recommended)

Since GPS requires HTTPS in most browsers, you can:

1. **Use a tool like `mkcert`** for local HTTPS:
   ```bash
   # Install mkcert (macOS)
   brew install mkcert
   mkcert -install
   mkcert localhost
   
   # Then serve with HTTPS using http-server
   npx http-server . -p 8080 -S -C localhost.pem -K localhost-key.pem
   ```

2. **Deploy to a free hosting service**:
   - GitHub Pages
   - Netlify
   - Vercel
   - Any static hosting with HTTPS

## Running Tests 🧪

The application includes a test page to verify calculations:

1. **Start the web server** (as above)

2. **Open the test page**:
   ```
   http://localhost:8080/test.html
   ```

3. **View test results** for different locations:
   - New York (UTC-5)
   - London (UTC+0) 
   - Tokyo (UTC+9)
   - Sydney (UTC+10)

The test page shows timezone detection, time corrections, and city matching for various coordinates worldwide.

## Project Structure 📁

```
exactaclock/
├── index.html              # Main application
├── test.html               # Test page for calculations
├── package.json            # Project configuration
├── README.md              # This file
└── src/
    ├── exactaclock.js     # Core timezone calculations
    └── app.js             # GPS handling and UI logic
```

## API Reference 🔧

### Core Functions

- `getExactTime(coordinates)` - Main function returning corrected time
- `getTimezone(coordinates)` - Get timezone for coordinates  
- `getNearestCity(coordinates)` - Find closest major city
- `getClosestTimezones(coordinates)` - Get nearest timezone boundaries

### Example Usage

```javascript
const result = ExactaClock.getExactTime({lat: 40.7128, lng: -74.0060});
console.log(result);
// {
//   exactTime: Date object,
//   currentTimezone: "UTC-5", 
//   timezoneFull: "Eastern Standard Time",
//   adjustmentMinutes: -15,
//   nearestCity: "New York"
// }
```

## Troubleshooting 🔍

- **"Location access denied"**: Check browser permissions and ensure HTTPS
- **"No GPS signal"**: Try refreshing or using a different device/location
- **Time seems wrong**: Verify your device's system time is correct
- **App won't load**: Check console for errors, ensure web server is running

## Browser Support

- Chrome/Chromium 50+
- Firefox 55+ 
- Safari 11+
- Edge 79+

GPS functionality requires HTTPS in most modern browsers.
