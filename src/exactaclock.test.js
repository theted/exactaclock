// Load the constants and functions for testing
import { beforeAll, describe, test, expect } from 'vitest'

// Sample timezone data for testing
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
    name: 'UTC-5',
    fullName: 'Eastern Standard Time',
    offset: -5,
    boundaries: [
      { lat: -90, lng: -82.5 },
      { lat: 90, lng: -67.5 }
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
    name: 'UTC+9',
    fullName: 'Japan Standard Time',
    offset: 9,
    boundaries: [
      { lat: -90, lng: 127.5 },
      { lat: 90, lng: 142.5 }
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
]

// Timezone calculation functions (duplicated for testing)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getTimezone = coordinates => {
  const { lng } = coordinates;
  for (const timezone of TIMEZONES) {
    const [west, east] = timezone.boundaries;
    if (lng >= west.lng && lng < east.lng) {
      return timezone;
    }
  }
  if (lng >= 172.5 || lng < -172.5) {
    return lng >= 172.5 ? TIMEZONES[TIMEZONES.length - 1] : TIMEZONES[0];
  }
  return TIMEZONES.find(tz => tz.name === 'UTC+0');
};

const getClosestTimezones = coordinates => {
  const { lat, lng } = coordinates;
  const timezoneDistances = TIMEZONES.map(timezone => {
    const [west, east] = timezone.boundaries;
    const centerLng = (west.lng + east.lng) / 2;
    const distance = calculateDistance(lat, lng, lat, centerLng);
    return { timezone, distance };
  });
  timezoneDistances.sort((a, b) => a.distance - b.distance);
  return [timezoneDistances[0], timezoneDistances[1]];
};

const getExactTime = coordinates => {
  const currentTimezone = getTimezone(coordinates);
  const closestTimezones = getClosestTimezones(coordinates);
  
  const [closest, secondClosest] = closestTimezones;
  
  if (closest.timezone === currentTimezone && closest.distance < 100) {
    return {
      exactTime: new Date(),
      currentTimezone: currentTimezone.name,
      timezoneFull: currentTimezone.fullName,
      adjustment: 0,
      adjustmentMinutes: 0,
      adjustmentSeconds: 0,
      adjustmentSecondsTotal: 0,
      adjustmentMilliseconds: 0,
      coordinates
    };
  }
  
  const totalDistance = closest.distance + secondClosest.distance;
  const interpolationFactor = totalDistance > 0 ? closest.distance / totalDistance : 0;
  const maxAdjustment = 30 * 60 * 1000; // 30 minutes in milliseconds
  const adjustment = (interpolationFactor - 0.5) * maxAdjustment;
  
  const now = new Date();
  const exactTime = new Date(now.getTime() + adjustment);
  
  const adjustmentMilliseconds = Math.round(adjustment);
  const adjustmentSeconds = Math.round((adjustment / 1000) * 100) / 100;
  const adjustmentMinutes = Math.round((adjustment / (60 * 1000)) * 100) / 100;
  const adjustmentSecondsTotal = Math.round(adjustment / 1000);
  
  return {
    exactTime,
    currentTimezone: currentTimezone.name,
    timezoneFull: currentTimezone.fullName,
    adjustment: adjustmentMinutes,
    adjustmentMinutes,
    adjustmentSeconds,
    adjustmentSecondsTotal,
    adjustmentMilliseconds,
    coordinates
  };
};

describe('Timezone Calculations', () => {
  test('should have 5 test timezones defined', () => {
    expect(TIMEZONES).toBeDefined()
    expect(TIMEZONES).toHaveLength(5)
  })

  test('should have correct timezone structure', () => {
    const firstTimezone = TIMEZONES[0]
    expect(firstTimezone).toHaveProperty('name')
    expect(firstTimezone).toHaveProperty('fullName')
    expect(firstTimezone).toHaveProperty('offset')
    expect(firstTimezone).toHaveProperty('boundaries')
    expect(firstTimezone.boundaries).toHaveLength(2)
  })

  test('should get timezone for New York coordinates', () => {
    const coordinates = { lat: 40.7128, lng: -74.0060 }
    const timezone = getTimezone(coordinates)
    
    expect(timezone.name).toBe('UTC-5')
    expect(timezone.fullName).toBe('Eastern Standard Time')
    expect(timezone.offset).toBe(-5)
  })

  test('should get timezone for London coordinates', () => {
    const coordinates = { lat: 51.5074, lng: -0.1278 }
    const timezone = getTimezone(coordinates)
    
    expect(timezone.name).toBe('UTC+0')
    expect(timezone.fullName).toBe('Greenwich Mean Time')
    expect(timezone.offset).toBe(0)
  })

  test('should get timezone for Tokyo coordinates', () => {
    const coordinates = { lat: 35.6762, lng: 139.6503 }
    const timezone = getTimezone(coordinates)
    
    expect(timezone.name).toBe('UTC+9')
    expect(timezone.fullName).toBe('Japan Standard Time')
    expect(timezone.offset).toBe(9)
  })

  test('should get exact time with correct structure', () => {
    const coordinates = { lat: 40.7128, lng: -74.0060 }
    const result = getExactTime(coordinates)
    
    expect(result).toHaveProperty('exactTime')
    expect(result).toHaveProperty('currentTimezone')
    expect(result).toHaveProperty('timezoneFull')
    expect(result).toHaveProperty('adjustmentMinutes')
    expect(result).toHaveProperty('adjustmentSeconds')
    expect(result).toHaveProperty('adjustmentSecondsTotal')
    expect(result).toHaveProperty('adjustmentMilliseconds')
    expect(result).toHaveProperty('coordinates')
    
    expect(result.exactTime).toBeInstanceOf(Date)
  })

  test('should calculate distance correctly', () => {
    // Distance between New York and London is approximately 5585 km
    const distance = calculateDistance(40.7128, -74.0060, 51.5074, -0.1278)
    expect(distance).toBeGreaterThan(5000)
    expect(distance).toBeLessThan(6000)
  })

  test('should get closest timezones', () => {
    const coordinates = { lat: 40.7128, lng: -74.0060 }
    const closest = getClosestTimezones(coordinates)
    
    expect(closest).toHaveLength(2)
    expect(closest[0]).toHaveProperty('timezone')
    expect(closest[0]).toHaveProperty('distance')
    expect(closest[1]).toHaveProperty('timezone')
    expect(closest[1]).toHaveProperty('distance')
    
    // First should be closer than second
    expect(closest[0].distance).toBeLessThanOrEqual(closest[1].distance)
  })

  test('should handle edge case longitude values', () => {
    // Test date line crossing
    const eastCoords = { lat: 0, lng: 179 }
    const westCoords = { lat: 0, lng: -179 }
    
    const eastResult = getTimezone(eastCoords)
    const westResult = getTimezone(westCoords)
    
    expect(eastResult).toBeDefined()
    expect(westResult).toBeDefined()
    expect(eastResult.name).toBe('UTC+12')
    expect(westResult.name).toBe('UTC-12')
  })

  test('should have consistent adjustment calculations', () => {
    const coordinates = { lat: 40.0, lng: -75.0 } // EST coordinates
    const result = getExactTime(coordinates)
    
    // Check that all adjustment values are consistent
    if (result.adjustmentMilliseconds !== 0) {
      const expectedSeconds = result.adjustmentMilliseconds / 1000
      expect(Math.abs(result.adjustmentSeconds - expectedSeconds)).toBeLessThan(0.1)
      
      const expectedMinutes = result.adjustmentMilliseconds / (60 * 1000)
      expect(Math.abs(result.adjustmentMinutes - expectedMinutes)).toBeLessThan(0.1)
    }
  })

  test('should not exceed maximum adjustment', () => {
    const coordinates = { lat: 40.0, lng: -82.5 } // Near timezone boundary
    const result = getExactTime(coordinates)
    
    // Maximum adjustment should be 30 minutes = 1800 seconds
    expect(Math.abs(result.adjustmentSecondsTotal)).toBeLessThanOrEqual(1800)
    expect(Math.abs(result.adjustmentMinutes)).toBeLessThanOrEqual(30)
  })
})