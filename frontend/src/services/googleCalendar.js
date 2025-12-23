const COMPANY_HOLIDAY_MAP = {
  "Republic Day": "Republic Day",
  "Holi": "Holi",
  "Ramzan Id (tentative)": "Eid-ul-Fitr",
  "Mahavir Jayanti": "Mahavir Jayanti",
  "Good Friday": "Good Friday",
  "Buddha Purnima": "Buddha Purnima",
  "Eid ul-Adha": "Bakrid",
  "Bakrid": "Eid-ul-Zuha (Bakrid)",
  "Muharram": "Muharram",
  "Independence Day": "Independence Day",
  "Milad un-Nabi": "Eid-e-Milad (Prophet's Birthday)",
  "Janmashtami": "Janmashtami",
  "Ganesh Chaturthi": "Ganesh Chaturthi",
  "Vinayak Chaturthi": "Ganesh Chaturthi",
  "Gandhi Jayanti": "Mahatma Gandhi's Birthday",
  "Dussehra": "Dussehra",
  "Diwali": "Diwali",
  "Guru Nanak Jayanti": "Guru Nanak Jayanti",
  "Christmas": "Christmas",
};

const GOOGLE_CALENDAR_API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
const INDIAN_HOLIDAYS_CALENDAR_ID = 'en.indian%23holiday@group.v.calendar.google.com';
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const holidayCache = new Map();


export const getHolidaysForYear = async (year) => {
  const cacheKey = `holidays_${year}`;
  const cached = holidayCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  try {
    const holidays = await fetchHolidaysFromAPI(year);
    holidayCache.set(cacheKey, {
      data: holidays,
      timestamp: Date.now(),
    });

    return holidays;
  } catch (error) {
    if (cached) {
      console.warn('Using expired cache due to fetch error:', error);
      return cached.data;
    }
    throw error;
  }
};

const fetchHolidaysFromAPI = async (year) => {
  const timeMin = `${year}-01-01T00:00:00Z`;
  const timeMax = `${year}-12-31T23:59:59Z`;
  const url = `https://www.googleapis.com/calendar/v3/calendars/${INDIAN_HOLIDAYS_CALENDAR_ID}/events?key=${GOOGLE_CALENDAR_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch holidays: ${response.statusText}`);
  }

  const data = await response.json();
  const holidays = data.items
    .filter(item => {
      if (!item.description || !item.description.includes('Public holiday')) {
        return false;
      }
      const holidayName = item.summary.toLowerCase();
      return Object.keys(COMPANY_HOLIDAY_MAP).some(key => {
        const keyLower = key.toLowerCase();
        return holidayName.includes(keyLower) || keyLower.includes(holidayName);
      });
    })
    .map(item => {
      const googleHolidayName = item.summary.toLowerCase();
      let companyHolidayName = item.summary; // Default to Google's name
      for (const [key, value] of Object.entries(COMPANY_HOLIDAY_MAP)) {
        const keyLower = key.toLowerCase();
        if (googleHolidayName.includes(keyLower) || keyLower.includes(googleHolidayName)) {
          companyHolidayName = value;
          break;
        }
      }

      return {
        date: item.start.date, // Format: YYYY-MM-DD
        name: companyHolidayName, // Use company's custom name
        description: item.description,
        type: 'public_holiday',
        originalName: item.summary, // Keep original for reference
      };
    });

  return holidays;
};

export const getHolidaysForMonth = async (year, month) => {
  const allHolidays = await getHolidaysForYear(year);
  
  return allHolidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.getMonth() === month && holidayDate.getFullYear() === year;
  });
};

export const prefetchAdjacentYears = (currentYear) => {
  const years = [currentYear - 1, currentYear + 1];
  
  years.forEach(year => {
    getHolidaysForYear(year).catch(error => {
      console.warn(`Failed to prefetch holidays for ${year}:`, error);
    });
  });
};

export const clearCache = () => {
  holidayCache.clear();
};
