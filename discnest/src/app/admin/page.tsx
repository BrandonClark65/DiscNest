// app/admin/page.tsx
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic'; // ensures fresh data each visit (optional)

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard />
    </div>
  );
}
