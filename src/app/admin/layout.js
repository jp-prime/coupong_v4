'use client';

import React from 'react';
import AdminHeader from '@/components/layout/AdminHeader';

export default function AdminLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen">
            <AdminHeader />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
