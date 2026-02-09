import React, { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
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
  const { currentPage, user } = useAppContext();

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

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
