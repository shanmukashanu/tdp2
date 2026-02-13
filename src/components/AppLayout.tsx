import React, { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { connectSocket } from '@/lib/socket';
import Navbar from './party/Navbar';
import Footer from './party/Footer';
import LoginModal from './party/LoginModal';
import HomePage from './party/HomePage';
import BlogsPage from './party/BlogsPage';
import PollsPage from './party/PollsPage';
import SurveysPage from './party/SurveysPage';
import MembersPage from './party/MembersPage';
import MessagesPage from './party/MessagesPage';
import CommunityPage from './party/CommunityPage';
import GroupsPage from './party/GroupsPage';
import WorksPage from './party/WorksPage';
import ContactPage from './party/ContactPage';
import ReportPage from './party/ReportPage';
import ProfilePage from './party/ProfilePage';
import AdminDashboard from './party/AdminDashboard';

const AppLayout: React.FC = () => {
  const { currentPage, user, isAuthenticated, setCurrentPage } = useAppContext();

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let s: any;
    try {
      s = connectSocket();
    } catch {
      return;
    }

    const onIncoming = (payload: any) => {
      try {
        if (!payload?.callId) return;
        const fromUserId = String(payload?.from?._id || '').trim();
        if (!fromUserId) return;

        const aa = Boolean(payload?.autoAnswer) || String(payload?.autoAnswer || '') === '1';

        localStorage.setItem(
          'tdp_pending_incoming_call',
          JSON.stringify({
            scope: 'private',
            callId: String(payload.callId),
            kind: payload.kind === 'video' ? 'video' : 'audio',
            fromUserId,
            fromName: String(payload?.from?.name || 'Member'),
            autoAnswer: aa,
          })
        );

        setCurrentPage('messages');
      } catch {
        // ignore
      }
    };

    const onIncomingGroup = (payload: any) => {
      try {
        if (!payload?.callId || !payload?.groupId) return;
        localStorage.setItem(
          'tdp_pending_incoming_call',
          JSON.stringify({
            scope: 'group',
            callId: String(payload.callId),
            kind: payload.kind === 'video' ? 'video' : 'audio',
            groupId: String(payload.groupId),
            fromUserId: String(payload?.from?._id || ''),
            fromName: String(payload?.from?.name || 'Member'),
          })
        );
        localStorage.setItem('tdp_open_group_id', String(payload.groupId));
        setCurrentPage('groups');
      } catch {
        // ignore
      }
    };

    s.on('call:incoming', onIncoming);
    s.on('groupcall:incoming', onIncomingGroup);

    return () => {
      s.off('call:incoming', onIncoming);
      s.off('groupcall:incoming', onIncomingGroup);
    };
  }, [isAuthenticated, setCurrentPage]);

  const renderPage = () => {
    // Admin pages - redirect to admin dashboard if user is admin
    if (currentPage.startsWith('admin-')) {
      if (user?.role === 'admin') {
        return <AdminDashboard />;
      }
      return <HomePage />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'blogs':
        return <BlogsPage />;
      case 'polls':
        return <PollsPage />;
      case 'surveys':
        return <SurveysPage />;
      case 'members':
        return <MembersPage />;
      case 'messages':
        return <MessagesPage />;
      case 'community':
        return <CommunityPage />;
      case 'groups':
        return <GroupsPage />;
      case 'works':
        return <WorksPage />;
      case 'contact':
        return <ContactPage />;
      case 'report':
        return <ReportPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer />
      <LoginModal />
    </div>
  );
};

export default AppLayout;
