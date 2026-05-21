import { redirect } from 'next/navigation';

// Manager messages uses the same admin messages view
export default function ManagerMessagesPage() {
  redirect('/admin/messages');
}
