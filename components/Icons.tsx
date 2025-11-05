
import React from 'react';

type IconProps = {
  className?: string;
};

export const LogoIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.29 9.29L13 12.59V18H11V12.59L7.71 9.29L9.12 7.88L12 10.75L14.88 7.88L16.29 9.29Z" fill="currentColor"/>
        <path d="M12 4C14.21 4 16.21 4.89 17.65 6.35L19.06 4.94C17.21 3.09 14.71 2 12 2V4Z" fill="currentColor" opacity="0.6"/>
    </svg>
);

export const BowlIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12h20zm-18 0c0-4.41 3.59-8 8-8s8 3.59 8 8H4zM7 9a1 1 0 11-2 0 1 1 0 012 0zm5 2a1 1 0 11-2 0 1 1 0 012 0zm4-3a1 1 0 110 2 1 1 0 010-2z"/>
    </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);

export const ChartIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>
);

export const BookIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
);

export const PremiumIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19.5 13.5-1.1-1.1a2.3 2.3 0 0 0-3.2 0l-1.8 1.8a2.3 2.3 0 0 1-3.2 0l-1.1-1.1a2.3 2.3 0 0 0-3.2 0l-1.8 1.8a2.3 2.3 0 0 1-3.2 0L.5 13.5"></path><path d="m19.5 5.5-1.1-1.1a2.3 2.3 0 0 0-3.2 0l-1.8 1.8a2.3 2.3 0 0 1-3.2 0l-1.1-1.1a2.3 2.3 0 0 0-3.2 0l-1.8 1.8a2.3 2.3 0 0 1-3.2 0L.5 5.5"></path></svg>
);

export const UserIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
