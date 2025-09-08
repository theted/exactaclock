// Enhanced timezone data with detailed names
const TIMEZONES = [
  {
    name: 'UTC-12',
    fullName: 'International Date Line West',
    offset: -12,
    boundaries: [
      { lat: -90, lng: -180 },
      { lat: 90, lng: -165 }
    ]
  },
  {
    name: 'UTC-11',
    fullName: 'Coordinated Universal Time-11',
    offset: -11,
    boundaries: [
      { lat: -90, lng: -165 },
      { lat: 90, lng: -157.5 }
    ]
  },
  {
    name: 'UTC-10',
    fullName: 'Hawaii-Aleutian Standard Time',
    offset: -10,
    boundaries: [
      { lat: -90, lng: -157.5 },
      { lat: 90, lng: -142.5 }
    ]
  },
  {
    name: 'UTC-9',
    fullName: 'Alaska Standard Time',
    offset: -9,
    boundaries: [
      { lat: -90, lng: -142.5 },
      { lat: 90, lng: -127.5 }
    ]
  },
  {
    name: 'UTC-8',
    fullName: 'Pacific Standard Time',
    offset: -8,
    boundaries: [
      { lat: -90, lng: -127.5 },
      { lat: 90, lng: -112.5 }
    ]
  },
  {
    name: 'UTC-7',
    fullName: 'Mountain Standard Time',
    offset: -7,
    boundaries: [
      { lat: -90, lng: -112.5 },
      { lat: 90, lng: -97.5 }
    ]
  },
  {
    name: 'UTC-6',
    fullName: 'Central Standard Time',
    offset: -6,
    boundaries: [
      { lat: -90, lng: -97.5 },
      { lat: 90, lng: -82.5 }
    ]
  },
  {
    name: 'UTC-5',
    fullName: 'Eastern Standard Time',
    offset: -5,
    boundaries: [
      { lat: -90, lng: -82.5 },
      { lat: 90, lng: -67.5 }
    ]
  },
  {
    name: 'UTC-4',
    fullName: 'Atlantic Standard Time',
    offset: -4,
    boundaries: [
      { lat: -90, lng: -67.5 },
      { lat: 90, lng: -52.5 }
    ]
  },
  {
    name: 'UTC-3',
    fullName: 'Argentina Standard Time',
    offset: -3,
    boundaries: [
      { lat: -90, lng: -52.5 },
      { lat: 90, lng: -37.5 }
    ]
  },
  {
    name: 'UTC-2',
    fullName: 'Mid-Atlantic Standard Time',
    offset: -2,
    boundaries: [
      { lat: -90, lng: -37.5 },
      { lat: 90, lng: -22.5 }
    ]
  },
  {
    name: 'UTC-1',
    fullName: 'Azores Standard Time',
    offset: -1,
    boundaries: [
      { lat: -90, lng: -22.5 },
      { lat: 90, lng: -7.5 }
    ]
  },
  {
    name: 'UTC+0',
    fullName: 'Greenwich Mean Time',
    offset: 0,
    boundaries: [
      { lat: -90, lng: -7.5 },
      { lat: 90, lng: 7.5 }
    ]
  },
  {
    name: 'UTC+1',
    fullName: 'Central European Time',
    offset: 1,
    boundaries: [
      { lat: -90, lng: 7.5 },
      { lat: 90, lng: 22.5 }
    ]
  },
  {
    name: 'UTC+2',
    fullName: 'Eastern European Time',
    offset: 2,
    boundaries: [
      { lat: -90, lng: 22.5 },
      { lat: 90, lng: 37.5 }
    ]
  },
  {
    name: 'UTC+3',
    fullName: 'Moscow Standard Time',
    offset: 3,
    boundaries: [
      { lat: -90, lng: 37.5 },
      { lat: 90, lng: 52.5 }
    ]
  },
  {
    name: 'UTC+4',
    fullName: 'Gulf Standard Time',
    offset: 4,
    boundaries: [
      { lat: -90, lng: 52.5 },
      { lat: 90, lng: 67.5 }
    ]
  },
  {
    name: 'UTC+5',
    fullName: 'Pakistan Standard Time',
    offset: 5,
    boundaries: [
      { lat: -90, lng: 67.5 },
      { lat: 90, lng: 82.5 }
    ]
  },
  {
    name: 'UTC+6',
    fullName: 'Bangladesh Standard Time',
    offset: 6,
    boundaries: [
      { lat: -90, lng: 82.5 },
      { lat: 90, lng: 97.5 }
    ]
  },
  {
    name: 'UTC+7',
    fullName: 'Indochina Time',
    offset: 7,
    boundaries: [
      { lat: -90, lng: 97.5 },
      { lat: 90, lng: 112.5 }
    ]
  },
  {
    name: 'UTC+8',
    fullName: 'China Standard Time',
    offset: 8,
    boundaries: [
      { lat: -90, lng: 112.5 },
      { lat: 90, lng: 127.5 }
    ]
  },
  {
    name: 'UTC+9',
    fullName: 'Japan Standard Time',
    offset: 9,
    boundaries: [
      { lat: -90, lng: 127.5 },
      { lat: 90, lng: 142.5 }
    ]
  },
  {
    name: 'UTC+10',
    fullName: 'Australian Eastern Standard Time',
    offset: 10,
    boundaries: [
      { lat: -90, lng: 142.5 },
      { lat: 90, lng: 157.5 }
    ]
  },
  {
    name: 'UTC+11',
    fullName: 'Solomon Islands Time',
    offset: 11,
    boundaries: [
      { lat: -90, lng: 157.5 },
      { lat: 90, lng: 172.5 }
    ]
  },
  {
    name: 'UTC+12',
    fullName: 'New Zealand Standard Time',
    offset: 12,
    boundaries: [
      { lat: -90, lng: 172.5 },
      { lat: 90, lng: 180 }
    ]
  }
];

// Export for use in other files
window.TIMEZONES = TIMEZONES;
