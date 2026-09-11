const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET /users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await req.user.populate('institution', 'name code');
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      avatar: user.avatar,
      notifications: user.notifications,
      theme: user.theme
    });
  } catch (err) {
    console.error('Get profile error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /users/profile/update
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, institution } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (institution) updates.institution = institution;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      institution: user.institution,
      avatar: user.avatar
    });
  } catch (err) {
    console.error('Update profile error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /users/change-password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Change password error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /users/settings (toggle notifications/theme)
exports.updateSettings = async (req, res) => {
  try {
    const { notifications, theme } = req.body;
    const updates = {};
    if (typeof notifications === 'boolean') updates.notifications = notifications;
    if (theme === 'light' || theme === 'dark') updates.theme = theme;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({
      notifications: user.notifications,
      theme: user.theme
    });
  } catch (err) {
    console.error('Update settings error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /users/avatar-upload (optional): handle avatar upload if you'd like
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: `/uploads/avatars/${req.file.filename}` }, { new: true }).select('-password');
    res.json({ avatar: user.avatar });
  } catch (err) {
    console.error('Upload avatar error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};
