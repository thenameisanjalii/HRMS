import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Edit2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { 
  getHolidaysForYear, 
  prefetchAdjacentYears 
} from "../services/googleCalendar";
import { holidaysAPI } from "../services/api";
import "./Calendar.css";

const Calendar = () => {
  const { user, canAccessFeature } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedHolidays, setEditedHolidays] = useState([]);
  const [customHolidays, setCustomHolidays] = useState([]);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    date: "",
    name: "",
    description: "",
  });

  // Use database permission for calendar editing
  const canEditCalendar = canAccessFeature('calendar.edit') || user?.role === 'CEO' || user?.role === 'ADMIN';

  // Fetch holidays from Google Calendar API and custom holidays from backend
  useEffect(() => {
    fetchHolidays();
  }, [currentYear]);

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch gazetted holidays from Google Calendar API
      const googleHolidays = await getHolidaysForYear(currentYear);
      
      // Fetch custom holidays from MongoDB
      const customHolidaysResponse = await holidaysAPI.getByYear(currentYear);
      const dbCustomHolidays = Array.isArray(customHolidaysResponse) 
        ? customHolidaysResponse.map(h => ({
            ...h,
            id: h._id,
            type: 'custom',
          }))
        : [];

      setHolidays(googleHolidays);
      setCustomHolidays(dbCustomHolidays);
      setEditedHolidays(googleHolidays);

      // Prefetch adjacent years in the background
      prefetchAdjacentYears(currentYear);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching holidays:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getHolidayForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const allHolidays = [...holidays, ...customHolidays];
    return allHolidays.find((h) => h.date === dateStr);
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const handleEditMode = () => {
    setIsEditMode(true);
    setEditedHolidays([...holidays]);
  };

  const handleSaveChanges = () => {
    setHolidays(editedHolidays);
    setIsEditMode(false);
    console.log("Saved holidays:", editedHolidays);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedHolidays([...holidays]);
  };

  const handleAddCustomHoliday = async () => {
    if (newHoliday.date && newHoliday.name) {
      try {
        const response = await holidaysAPI.add(newHoliday);
        
        if (response.holiday) {
          // Add to local state with proper ID from MongoDB
          const addedHoliday = {
            ...response.holiday,
            id: response.holiday._id,
            type: 'custom',
          };
          setCustomHolidays([...customHolidays, addedHoliday]);
          setNewHoliday({ date: "", name: "", description: "" });
          setShowAddHolidayModal(false);
        } else {
          alert(response.message || 'Failed to add holiday');
        }
      } catch (error) {
        console.error('Error adding holiday:', error);
        alert('Failed to add holiday. Please try again.');
      }
    }
  };

  const handleRemoveHoliday = async (holiday) => {
    if (!holiday.id && !holiday._id) {
      console.error('Holiday ID not found');
      return;
    }

    const holidayId = holiday.id || holiday._id;
    
    try {
      const response = await holidaysAPI.delete(holidayId);
      
      if (response.message) {
        // Remove from local state
        setCustomHolidays(customHolidays.filter((h) => (h.id || h._id) !== holidayId));
      } else {
        alert('Failed to delete holiday');
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      alert('Failed to delete holiday. Please try again.');
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];
    const today = new Date();
    const isCurrentMonth =
      today.getFullYear() === currentYear && today.getMonth() === currentMonth;

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const holiday = getHolidayForDate(currentYear, currentMonth, day);
      const isToday = isCurrentMonth && today.getDate() === day;
      const isWeekend =
        new Date(currentYear, currentMonth, day).getDay() === 0 ||
        new Date(currentYear, currentMonth, day).getDay() === 6;

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? "today" : ""} ${
            holiday ? "holiday" : ""
          } ${isWeekend ? "weekend" : ""}`}
          title={
            holiday
              ? `${holiday.name}${
                  holiday.description ? ": " + holiday.description : ""
                }`
              : ""
          }
        >
          <div className="day-number">{day}</div>
          {holiday && (
            <div className="holiday-info">
              <div className="holiday-name">{holiday.name}</div>
              {isEditMode && canEditCalendar && holiday.type === 'custom' && (
                <button
                  className="remove-holiday-btn"
                  onClick={() => handleRemoveHoliday(holiday)}
                  title="Remove holiday"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-title">
          <CalendarIcon size={24} />
          <h2>Company Calendar - Gazetted Holidays</h2>
        </div>
        <div className="calendar-actions">
          {canEditCalendar && !isEditMode && (
            <button className="btn-edit" onClick={handleEditMode}>
              <Edit2 size={16} />
              Edit Calendar
            </button>
          )}
          {canEditCalendar && isEditMode && (
            <>
              <button className="btn-save" onClick={handleSaveChanges}>
                <Save size={16} />
                Save Changes
              </button>
              <button className="btn-cancel" onClick={handleCancelEdit}>
                <X size={16} />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="calendar-error">
          <p>Error loading holidays: {error}</p>
          <button onClick={fetchHolidays}>Retry</button>
        </div>
      )}

      <div className="calendar-navigation">
        <button className="nav-btn" onClick={goToPreviousMonth}>
          <ChevronLeft size={20} />
        </button>
        <div className="current-month">
          <h3>
            {monthNames[currentMonth]} {currentYear}
          </h3>
        </div>
        <button className="nav-btn" onClick={goToNextMonth}>
          <ChevronRight size={20} />
        </button>
        <button className="btn-today" onClick={goToToday}>
          Today
        </button>
      </div>

      {isEditMode && canEditCalendar && (
        <div className="edit-toolbar">
          <button
            className="btn-add-holiday"
            onClick={() => setShowAddHolidayModal(true)}
          >
            Add Custom Holiday
          </button>
        </div>
      )}

      {loading ? (
        <div className="calendar-loading">Loading holidays...</div>
      ) : (
        <>
          <div className="calendar-weekdays">
            {weekDays.map((day) => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
          </div>
          <div className="calendar-grid">{renderCalendar()}</div>
        </>
      )}

      <div className="holiday-list">
        <h3>
          Holidays in {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="holiday-items">
          {[...holidays, ...customHolidays]
            .filter((h) => {
              const hDate = new Date(h.date);
              return (
                hDate.getMonth() === currentMonth &&
                hDate.getFullYear() === currentYear
              );
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((holiday, index) => (
              <div key={index} className="holiday-item">
                <div className="holiday-date">
                  {new Date(holiday.date).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <div className="holiday-details">
                  <div className="holiday-item-name">{holiday.name}</div>
                  {holiday.description && (
                    <div className="holiday-description">
                      {holiday.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          {[...holidays, ...customHolidays].filter((h) => {
            const hDate = new Date(h.date);
            return (
              hDate.getMonth() === currentMonth &&
              hDate.getFullYear() === currentYear
            );
          }).length === 0 && (
            <p className="no-holidays">No holidays this month</p>
          )}
        </div>
      </div>

      {showAddHolidayModal && canEditCalendar && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddHolidayModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Custom Holiday</h3>
              <button
                className="modal-close"
                onClick={() => setShowAddHolidayModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) =>
                    setNewHoliday({ ...newHoliday, date: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Holiday Name</label>
                <input
                  type="text"
                  value={newHoliday.name}
                  onChange={(e) =>
                    setNewHoliday({ ...newHoliday, name: e.target.value })
                  }
                  placeholder="e.g., Company Foundation Day"
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={newHoliday.description}
                  onChange={(e) =>
                    setNewHoliday({
                      ...newHoliday,
                      description: e.target.value,
                    })
                  }
                  placeholder="Additional details about the holiday"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowAddHolidayModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleAddCustomHoliday}
                disabled={!newHoliday.date || !newHoliday.name}
              >
                Add Holiday
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color today-color"></span>
          <span>Today</span>
        </div>
        <div className="legend-item">
          <span className="legend-color holiday-color"></span>
          <span>Holiday</span>
        </div>
        <div className="legend-item">
          <span className="legend-color weekend-color"></span>
          <span>Weekend</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
