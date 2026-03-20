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
            <div className="container mx-auto max-w-4xl px-4 py-3 md:py-4 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
                <Link href="https://moderngrains.com/" target="_blank" className="hover:opacity-80 transition-opacity">
                    <img src="/Images/Logo.png" alt="Modern Grain Studios" className="h-8 md:h-12 w-auto" />
                </Link>

                {/* Step Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 text-[10px] sm:text-xs md:text-sm font-semibold text-secondary">
                    <span className={`${isProjects ? 'text-primary' : ''} whitespace-nowrap`}>
                        Select Projects
                    </span>
                    <span className="opacity-50">&gt;</span>
                    <span className={`${isEditing ? 'text-primary' : ''} whitespace-nowrap`}>
                        Provide Feedback
                    </span>
                    <span className="opacity-50">&gt;</span>
                    <span className={`${isSuccess ? 'text-primary' : ''} whitespace-nowrap`}>
                        Complete
                    </span>
                </div>
            </div>
        </nav>
    );
}
