'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Users, ShoppingCart, DollarSign, TrendingUp, Menu, X, Home } from 'lucide-react';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReferralsCard } from '@/components/admin/ReferralsCard';
import { UsersCard } from '@/components/admin/UsersCard';
import { PaymentsCard } from '@/components/admin/PaymentsCard';
import { cn } from '@/lib/utils';
import { getFirestore, getDocs, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface UserStats {
  totalUsers: number;
  totalServiceProviders: number;
  totalRevenue: number;
  growthRate: number;
}

export default function AdminDashboard() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalServiceProviders: 0,
    totalRevenue: 0,
    growthRate: 0
  });
  const router = useRouter();
  const [activeTable, setActiveTable] = useState("users"); // users, payments, referrals

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    
    gsap.fromTo(header,
      { opacity: 0, y: -50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
      }
    );
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const db = getFirestore();
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => doc.data());
        
        const totalUsers = users.length;
        const serviceProviders = users.filter(user => user.role === 'service_provider').length;
        const totalRevenue = users.reduce((sum, user) => sum + (user.revenue || 0), 0);

        // Calculate growth rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentUsers = users.filter(user => 
          new Date(user.createdAt) > thirtyDaysAgo
        );
        const growthRate = (recentUsers.length / totalUsers) * 100;

        setStats({
          totalUsers,
          totalServiceProviders: serviceProviders,
          totalRevenue,
          growthRate: Math.round(growthRate * 10) / 10
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const renderTable = () => {
    switch (activeTable) {
      case "payments":
        return <PaymentsCard />;
      case "referrals":
        return <ReferralsCard />;
      default:
        return <UsersCard />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white dark:bg-black border-r border-black/10 dark:border-white/10 transform transition-transform duration-200 ease-in-out z-50",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black dark:text-white">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
            onClick={() => router.push('/')}
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-black/10 dark:border-white/10 bg-white dark:bg-black">
        <div className="flex h-14 items-center px-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="ml-4 text-lg font-semibold text-black dark:text-white">Admin Dashboard</h2>
        </div>
      </header>

      <div className="flex-1">
        {/* Main Content */}
        <main className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              trend={{ value: stats.growthRate, isPositive: stats.growthRate > 0 }}
              className="bg-white dark:bg-black"
            />
            <DashboardCard
              title="Service Providers"
              value={stats.totalServiceProviders}
              icon={Users}
              className="bg-white dark:bg-black"
            />
            <DashboardCard
              title="Revenue"
              value={`₹${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              className="bg-white dark:bg-black"
            />
            <DashboardCard
              title="Growth"
              value={`${stats.growthRate}%`}
              icon={TrendingUp}
              className="bg-white dark:bg-black"
            />
          </div>

          {/* Table Selection */}
          <div className="flex items-center space-x-6">
            <RadioGroup
              defaultValue="users"
              value={activeTable}
              onValueChange={setActiveTable}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="users" id="users" />
                <Label htmlFor="users">All Users</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="payments" id="payments" />
                <Label htmlFor="payments">Recent Payments</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="referrals" id="referrals" />
                <Label htmlFor="referrals">Referral History</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Dynamic Table */}
          {renderTable()}
        </main>
      </div>
    </div>
  );
} 