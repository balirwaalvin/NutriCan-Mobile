
import React from 'react';

// FIX: Add style prop to allow for inline styling of icons.
type IconProps = {
  className?: string;
  style?: React.CSSProperties;
};

export const LogoIcon: React.FC<IconProps> = ({ className, style }) => (
    <img 
        src="https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FNutriCan%20Logo.png?alt=media&token=054862be-4408-4335-9b95-871807cccbe9" 
        alt="NutriCan Logo" 
        className={className} 
        style={style}
    />
);

export const BowlIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12h20zm-18 0c0-4.41 3.59-8 8-8s8 3.59 8 8H4zM7 9a1 1 0 11-2 0 1 1 0 012 0zm5 2a1 1 0 11-2 0 1 1 0 012 0zm4-3a1 1 0 110 2 1 1 0 010-2z"/>
    </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);

export const ChartIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>
);

export const BookIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
);

export const PremiumIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19.5 13.5-1.1-1.1a2.3 2.3 0 0 0-3.2 0l-1.8 1.8a2.3 2.3 0 0 1-3.2 0l-1.1-1.1a2.3 2.3 0 0 0-3.2 0l-1.8 1.8a2.3 2.3 0 0 1-3.2 0L.5 13.5"></path><path d="m19.5 5.5-1.1-1.1a2.3 2.3 0 0 0-3.2 0l-1.8 1.8a2.3 2.3 0 0 1-3.2 0l-1.1-1.1a2.3 2.3 0 0 0-3.2 0l-1.8 1.8a2.3 2.3 0 0 1-3.2 0L.5 5.5"></path></svg>
);

export const UserIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

export const ProteinIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.83,11.17a3.49,3.49,0,0,0-4.66,0L4,15.34l1.41,1.41,1-1V21h2V18h2v3h2V15.75l1-1L17,15.34ZM18,7a4,4,0,0,0-3.5,2.06,4,4,0,0,0-7,0A4,4,0,0,0,6,13H18a4,4,0,0,0,0-8Z"/>
    </svg>
);

export const CarbsIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
       <path d="M21.5,8.5c-1,0-1.5-0.75-2-1.25s-1-1.25-2-1.25-1.5,0.75-2,1.25S14.5,8.5,13.5,8.5s-1.5-0.75-2-1.25S10.5,6,9.5,6,8,6.75,7.5,7.25s-1,1.25-2,1.25S4,8,3.5,7.5,2,6,2.5,6s1.5,0.75,2,1.25S5.5,8.5,6.5,8.5s1.5-0.75,2-1.25S9.5,6,10.5,6s1.5,0.75,2,1.25S13.5,8.5,14.5,8.5s1.5-0.75,2-1.25S17.5,6,18.5,6s1.5,0.75,2,1.25S21.5,8.5,21.5,8.5M21,11H3v2h18v-2M21,15H3v2h18v-2M21,19H3v2h18v-2Z"/>
    </svg>
);

export const BalancedIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
);