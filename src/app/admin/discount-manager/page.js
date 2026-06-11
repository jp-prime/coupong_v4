"use client";

import React, { Suspense } from 'react';
import DiscountManagerPage from './DiscountManagerPage';
import { Loader2 } from 'lucide-react';

export default function Page() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
                <Loader2 className="animate-spin" size={40} color="#6366f1" />
            </div>
        }>
            <DiscountManagerPage />
        </Suspense>
    );
}
