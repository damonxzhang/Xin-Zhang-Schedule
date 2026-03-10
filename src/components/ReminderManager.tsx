import { useEffect, useRef } from 'react';
import emailjs from 'emailjs-com';
import { Schedule } from '../types';
import { subMinutes, isBefore, parseISO } from 'date-fns';

interface ReminderManagerProps {
  schedules: Schedule[];
  onReminderSent: (id: string) => void;
}

// NOTE: To use this in production, you need to sign up at https://www.emailjs.com/
// and replace these placeholders with your actual IDs.
const EMAILJS_SERVICE_ID = 'service_schedule_remind';
const EMAILJS_TEMPLATE_ID = 'template_schedule_remind';
const EMAILJS_PUBLIC_KEY = 'user_placeholder_key';

export default function ReminderManager({ schedules, onReminderSent }: ReminderManagerProps) {
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  const sendEmail = async (schedule: Schedule) => {
    if (!schedule.reminder.email) return;

    try {
      console.log(`Sending reminder for: ${schedule.title}`);
      
      // Scheme A: EmailJS (Client-side)
      // In a real app, you'd call emailjs.send()
      // For this demo, we'll simulate the call if the key is placeholder
      if (EMAILJS_PUBLIC_KEY === 'user_placeholder_key') {
        console.warn('EmailJS Public Key is placeholder. Simulating email send.');
      } else {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: schedule.reminder.email,
            title: schedule.title,
            time: new Date(schedule.dateTime).toLocaleString(),
            notes: schedule.notes || 'No notes provided.',
            category: schedule.category,
          },
          EMAILJS_PUBLIC_KEY
        );
      }
      
      onReminderSent(schedule.id);
    } catch (error) {
      console.error('Failed to send email reminder:', error);
    }
  };

  /**
   * Scheme B (Backend):
   * If you have a backend, you would replace the sendEmail function with:
   * 
   * const sendEmail = async (schedule: Schedule) => {
   *   await fetch('/api/reminders/send', {
   *     method: 'POST',
   *     headers: { 'Content-Type': 'application/json' },
   *     body: JSON.stringify({ scheduleId: schedule.id })
   *   });
   *   onReminderSent(schedule.id);
   * };
   */

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      
      schedules.forEach(schedule => {
        if (
          schedule.reminder.enabled && 
          !schedule.reminder.sent && 
          !schedule.completed
        ) {
          const scheduleTime = parseISO(schedule.dateTime);
          const reminderTime = subMinutes(scheduleTime, schedule.reminder.leadTimeMinutes);
          
          if (isBefore(reminderTime, now)) {
            sendEmail(schedule);
          }
        }
      });
    };

    // Check every minute
    checkInterval.current = setInterval(checkReminders, 60000);
    
    // Initial check
    checkReminders();

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [schedules]);

  return null; // This component doesn't render anything
}
