const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../lib/global');

// Get all custom holidays for a specific year
router.get('/:year', protect, async (req, res) => {
  try {
    const { year } = req.params;
    const holidays = await Holiday.find({ year: parseInt(year) })
      .sort({ date: 1 })
      .select('-__v');
    
    res.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ message: 'Failed to fetch holidays' });
  }
});

// Add a new custom holiday (CEO only)
router.post('/', protect, authorize(ROLES.CEO), async (req, res) => {
  try {
    const { date, name, description } = req.body;

    if (!date || !name) {
      return res.status(400).json({ message: 'Date and name are required' });
    }

    // Extract year from date
    const year = new Date(date).getFullYear();

    // Check if holiday already exists for this date
    const existingHoliday = await Holiday.findOne({ date });
    if (existingHoliday) {
      return res.status(400).json({ message: 'A holiday already exists on this date' });
    }

    const holiday = new Holiday({
      date,
      name,
      description: description || '',
      type: 'custom',
      addedBy: req.user.id,
      year,
    });

    await holiday.save();

    res.status(201).json({
      message: 'Holiday added successfully',
      holiday,
    });
  } catch (error) {
    console.error('Error adding holiday:', error);
    res.status(500).json({ message: 'Failed to add holiday' });
  }
});

// Update a custom holiday (CEO only)
router.put('/:id', protect, authorize(ROLES.CEO), async (req, res) => {
  try {
    const { id } = req.params;
    const { date, name, description } = req.body;

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    // Update fields
    if (date) {
      holiday.date = date;
      holiday.year = new Date(date).getFullYear();
    }
    if (name) holiday.name = name;
    if (description !== undefined) holiday.description = description;

    await holiday.save();

    res.json({
      message: 'Holiday updated successfully',
      holiday,
    });
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({ message: 'Failed to update holiday' });
  }
});

// Delete a custom holiday (CEO only)
router.delete('/:id', protect, authorize(ROLES.CEO), async (req, res) => {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findByIdAndDelete(id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    res.json({
      message: 'Holiday deleted successfully',
      holiday,
    });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ message: 'Failed to delete holiday' });
  }
});

// Delete holiday by date (CEO only)
router.delete('/date/:date', protect, authorize(ROLES.CEO), async (req, res) => {
  try {
    const { date } = req.params;

    const holiday = await Holiday.findOneAndDelete({ date });
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found for this date' });
    }

    res.json({
      message: 'Holiday deleted successfully',
      holiday,
    });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ message: 'Failed to delete holiday' });
  }
});

module.exports = router;
