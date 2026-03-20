import { Clock, Wrench } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full bg-black py-16 border-t border-[#3a2516] mt-16">
            <div className="container mx-auto max-w-4xl px-6 flex flex-col md:flex-row md:justify-between items-start pt-6 gap-12 md:gap-0">

                {/* Logo and About */}
                <div className="flex flex-col gap-5 w-full md:w-1/3 md:pr-8">
                    <img src="/Images/Logo.png" alt="Modern Grain Studios" className="w-32 opacity-90 mx-auto md:mx-0" />
                    <p className="text-sm leading-relaxed text-[#81531e] mt-2 text-center md:text-left">
                        At Modern Grain Studios, each project is our reputation, where art meets craftsmanship, and simplicity in collaboration is always at hand.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="w-full md:w-1/3 md:px-4">
                    <div className="border-b border-[#9E6726] mb-6 pb-3">
                        <h3 className="text-xl font-bold text-white text-center md:text-left">Quick Links</h3>
                    </div>
                    <ul className="space-y-4 text-sm font-medium text-white list-none m-0 p-0 text-center md:text-left">
                        <li><a href="https://moderngrains.com/" className="hover:text-[#CE996A] transition-colors text-white">About Us</a></li>
                        <li><a href="https://moderngrains.com/" className="hover:text-[#CE996A] transition-colors text-white">Services</a></li>
                        <li><a href="https://moderngrains.com/" className="hover:text-[#CE996A] transition-colors text-white">Portfolio</a></li>
                        <li><a href="https://moderngrains.com/" className="hover:text-[#CE996A] transition-colors text-white">Contact Us</a></li>
                    </ul>
                </div>

                {/* Work Hours */}
                <div className="w-full md:w-1/3 md:pl-8">
                    <div className="border-b border-[#9E6726] mb-6 pb-3">
                        <h3 className="text-xl font-bold text-white text-center md:text-left">Work Hours</h3>
                    </div>
                    <ul className="space-y-4 text-sm font-medium text-white list-none m-0 p-0">
                        <li className="flex items-start md:items-start justify-center md:justify-start gap-3">
                            <Clock size={20} color="#81531e" className="mt-0.5 shrink-0" />
                            <span className="leading-snug text-center md:text-left">8 AM - 5 PM , Monday - Saturday</span>
                        </li>
                        <li className="flex items-center justify-center md:justify-start gap-3">
                            <Wrench size={20} color="#81531e" className="shrink-0" />
                            <span className="text-center md:text-left">24/7 Emergency Support</span>
                        </li>
                        <li className="mt-8 pt-2 flex justify-center md:justify-start">
                            <a href="https://moderngrains.com/contact" target="_blank" className="bg-[#81531e] hover:bg-[#6c461a] text-white text-sm py-2.5 px-6 transition-colors shadow-sm font-bold inline-block border border-[#81531e]">
                                Contact us
                            </a>
                        </li>
                    </ul>
                </div>

            </div>
        </footer>
    );
}
