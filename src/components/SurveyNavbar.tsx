"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SurveyNavbar() {
    const pathname = usePathname();

    // Determine active step based on path
    const isEditing = pathname.includes('/feedback');
    const isSuccess = pathname.includes('/success');
    const isProjects = !isEditing && !isSuccess;

    return (
        <nav className="w-full bg-surface border-b border-surface-border shadow-md sticky top-0 z-50">
            <div className="container mx-auto max-w-4xl px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <Link href="https://moderngrains.com/" target="_blank" className="hover:opacity-80 transition-opacity">
                    <img src="/Images/Logo.png" alt="Modern Grain Studios" className="h-12 w-auto" />
                </Link>

                {/* Step Indicators */}
                <div className="flex items-center gap-2 md:gap-4 text-sm font-semibold text-secondary">
                    <span className={`${isProjects ? 'text-primary' : ''}`}>
                        Select Projects
                    </span>
                    <span>&gt;</span>
                    <span className={`${isEditing ? 'text-primary' : ''}`}>
                        Provide Feedback
                    </span>
                    <span>&gt;</span>
                    <span className={`${isSuccess ? 'text-primary' : ''}`}>
                        Complete
                    </span>
                </div>
            </div>
        </nav>
    );
}
