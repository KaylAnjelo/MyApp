const { supabase } = require('../config/supabase');

class NotificationsController {
	// Get all notifications for a user
	async getUserNotifications(req, res) {
		const { userId } = req.params;
		try {
			const { data, error } = await supabase
				.from('notifications')
				.select('*')
				.eq('user_id', userId)
				.order('created_at', { ascending: false });
			if (error) return res.status(500).json({ error: error.message });
			res.json({ notifications: data });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	// Mark a notification as read
	async markAsRead(req, res) {
		const { notificationId } = req.params;
		console.log('PATCH /notifications/read called with notificationId:', notificationId);
		try {
			const { error } = await supabase
				.from('notifications')
				.update({ is_read: true })
				.eq('id', notificationId);
			if (error) return res.status(500).json({ error: error.message });
			res.json({ message: 'Notification marked as read' });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	// (Optional) Create a notification manually
	async createNotification(req, res) {
		const { user_id, title, message } = req.body;
		try {
			const { error } = await supabase
				.from('notifications')
				.insert({
					user_id,
					title,
					message,
					is_read: false,
					created_at: new Date().toISOString()
				});
			if (error) return res.status(500).json({ error: error.message });
			res.json({ message: 'Notification created' });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}
}

module.exports = new NotificationsController();

